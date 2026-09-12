---
title: "PPO 的 Clip 真的限制了梯度吗？从负 Advantage 下的大 Importance Ratio 说起"
slug: ppo-importance-ratio-saturation
date: 2026-09-12
description: "从负 Advantage 与极端 Importance Ratio 出发，推导一种保持梯度方向、同时平滑限制更新强度的 surrogate objective。"
tags: [Reinforcement Learning, PPO, Policy Gradient]
draft: false
---

最近在看 PPO / GRPO 的 policy gradient 实现时，我注意到一个挺有意思的问题：

> 当 advantage 为负，而 importance ratio 非常大时，PPO 的 clipping 并不会阻止一个非常大的负向梯度。

这件事乍看有点反直觉。很多人对 PPO clipping 的第一印象是：

> ratio 太大或者太小，就把它截断，避免 policy 更新过猛。

但严格来说，这并不完全正确。

这篇文章从这个问题出发，尝试构造一种**不依赖 hard clipping，而是平滑限制 policy gradient 强度**的 surrogate objective。

---

## 1. 从最基本的 Policy Gradient 开始

对于一个 token/action，最简单的 importance-weighted policy objective 可以写成：

$$
J_t(\theta)=r_tA_t
$$

其中：

$$
r_t=
\frac{\pi_\theta(a_t|s_t)}
{\pi_{\mathrm{old}}(a_t|s_t)}
$$

\(A_t\) 是 advantage。

因为：

$$
\nabla_\theta r_t
=
r_t\nabla_\theta\log\pi_\theta(a_t|s_t)
$$

所以：

$$
\nabla_\theta J_t
=
A_t r_t
\nabla_\theta\log\pi_\theta(a_t|s_t)
$$

这个公式其实已经说明了两个东西：

$$
\boxed{
A_t\text{ 决定强化还是抑制，}
\quad
r_t\text{ 决定梯度被放大多少}
}
$$

当 \(A_t>0\)，我们希望提高当前 token 的概率。

当 \(A_t<0\)，我们希望降低当前 token 的概率。

问题在于，如果：

$$
A_t=-1,\qquad r_t=10000
$$

那么：

$$
\nabla_\theta J_t
=
-10000
\nabla_\theta\log\pi_\theta
$$

负向更新可能非常大。

---

## 2. PPO clipping 能解决这个问题吗？

PPO 的 clipped objective 是：

$$
J_t^{\mathrm{PPO}}
=
\min
\left(
r_tA_t,\;
\operatorname{clip}(r_t,1-\epsilon,1+\epsilon)A_t
\right)
$$

假设：

$$
A_t=-1,\qquad
r_t=10000,\qquad
\epsilon=0.2
$$

第一项：

$$
r_tA_t=-10000
$$

第二项：

$$
1.2\times(-1)=-1.2
$$

于是：

$$
\min(-10000,-1.2)=-10000
$$

也就是说，**这里并没有被 clip。**

梯度依然是：

$$
\nabla_\theta J_t
=
-10000\nabla_\theta\log\pi_\theta
$$

为什么？

因为 PPO clipping 本身就是**非对称的**。

对于 \(A>0\)，PPO 防止一个好 action 的概率被提高得太多：

$$
r>1+\epsilon
\quad\Rightarrow\quad
\nabla J=0
$$

对于 \(A<0\)，PPO 防止一个坏 action 的概率被降低得太多：

$$
r<1-\epsilon
\quad\Rightarrow\quad
\nabla J=0
$$

但是：

$$
\boxed{
A<0,\quad r\gg1
}
$$

意味着一个“坏 action”的概率反而比 old policy 高了很多。

PPO 认为这是一个应该被强烈纠正的方向，所以不会把它 clip 掉。

逻辑上没有错。

但问题是：**真的有必要让这种纠正强度随着 \(r\) 无限增长吗？**

---

## 3. 我真正想限制的不是 ratio，而是梯度强度

这里可以换一个思路。

我们不一定需要说：

> \(r\) 超过某个值以后，直接把梯度变成 0。

我们真正想要的可能是：

> \(r\) 越大，负向抑制越强；但是这种抑制应该逐渐饱和，而不是无限增长。

也就是希望找到一个函数 \(h(r)\)，满足：

$$
h(1)=1
$$

这样 policy 没有明显 drift 时，不改变原始 PG。

同时：

$$
h(r)\approx r
$$

在正常区域尽量保持 importance sampling 的行为。

但当：

$$
r\rightarrow\infty
$$

希望：

$$
h(r)\rightarrow B
$$

其中 \(B\) 是我们允许的最大梯度放大倍数。

一个很简单的候选是：

$$
\boxed{
h_B(r)=\frac{Br}{B-1+r}
}
$$

其中 \(B>1\)。

---

## 4. 一个 Smooth Saturation Importance Weight

这个函数有几个不错的性质。

首先：

$$
h_B(1)=1
$$

所以在 \(r=1\) 处，它和原始 importance weight 完全一致。

其次：

$$
\lim_{r\rightarrow\infty}h_B(r)=B
$$

所以无论 ratio 多大：

$$
\boxed{
h_B(r)\le B
}
$$

例如取 \(B=2\)：

| \(r\) | 原始 \(r\) | \(h_2(r)\) |
| ----: | -------: | ---------: |
|   0.5 |      0.5 |      0.667 |
|     1 |        1 |          1 |
|     2 |        2 |      1.333 |
|    10 |       10 |      1.818 |
|   100 |      100 |      1.980 |
| 10000 |    10000 |     1.9998 |

于是刚才：

$$
A=-1,\qquad r=10000
$$

原本对应：

$$
-10000\nabla\log\pi
$$

现在变成大约：

$$
-2\nabla\log\pi
$$

**方向没有改变，但更新强度有界。**

这和 hard clipping 有明显区别。

PPO 更像：

$$
\text{正常梯度}
\rightarrow
\text{突然变成 0}
$$

而 smooth saturation 是：

$$
\text{正常增长}
\rightarrow
\text{增长逐渐变慢}
\rightarrow
\text{趋近有限上限}
$$

---

## 5. 不能只改梯度：能否找到对应的 Objective？

如果只是手工把梯度中的 \(r\) 换成 \(h(r)\)，当然可以实现。

但更自然的问题是：

> 是否存在一个真正的 surrogate objective，它求导之后恰好得到这个梯度？

假设：

$$
J_{\mathrm{smooth}}=A f(r)
$$

我们希望：

$$
\nabla_\theta J_{\mathrm{smooth}}
=
A h_B(r)
\nabla_\theta\log\pi_\theta
$$

又因为：

$$
\nabla_\theta r
=
r\nabla_\theta\log\pi_\theta
$$

所以：

$$
\nabla_\theta f(r)
=
f'(r)r\nabla_\theta\log\pi_\theta
$$

因此只需要满足：

$$
rf'(r)=h_B(r)
$$

代入：

$$
h_B(r)=\frac{Br}{B-1+r}
$$

得到：

$$
f'(r)=\frac{B}{B-1+r}
$$

积分：

$$
f(r)=B\log(B-1+r)+C
$$

如果希望 \(f(1)=1\)，可以写成：

$$
\boxed{
f_B(r)
=
1+
B\log
\left(
\frac{B-1+r}{B}
\right)
}
$$

于是得到一个完整的 smooth surrogate：

$$
\boxed{
J_{\mathrm{smooth}}
=
A
\left[
1+
B\log
\left(
\frac{B-1+r}{B}
\right)
\right]
}
$$

它的梯度正好是：

$$
\boxed{
\nabla_\theta J_{\mathrm{smooth}}
=
A
\frac{Br}{B-1+r}
\nabla_\theta\log\pi_\theta
}
$$

这就比较有意思了。

它不是简单做 gradient clipping，而是从 objective 本身构造出了一个**有界的 effective importance weight**。

---

## 6. 如果只担心 Negative Advantage 呢？

实际上，我最初关注的问题并不是所有 \(r\)，而是：

$$
A<0,\qquad r\gg1
$$

因此可以进一步做成 asymmetric objective。

定义：

$$
A^+=\max(A,0)
$$

$$
A^-=\min(A,0)
$$

然后：

$$
\boxed{
J
=
A^+r
+
A^-f_B(r)
}
$$

对应梯度：

$$
\boxed{
\nabla J
=
\left[
A^+r
+
A^-
\frac{Br}{B-1+r}
\right]
\nabla\log\pi
}
$$

这样：

对于 positive advantage：

$$
A>0
$$

仍然保持原始 importance-weighted PG。

而对于 negative advantage：

$$
A<0
$$

使用：

$$
A\frac{Br}{B-1+r}
$$

因此：

$$
\left|
A\frac{Br}{B-1+r}
\right|
\le B|A|
$$

也就是说：

> **坏 action 仍然会受到惩罚，但单个 token 的 importance weight 不会无限放大这种惩罚。**

这正是我想要的性质。

---

## 7. 另一种思路：在 Log-Ratio 空间做 Saturation

还有一种思路也很自然。

定义：

$$
z=\log r
$$

然后直接构造：

$$
J=A B\tanh(z/B)
$$

由于：

$$
\nabla_\theta z
=
\nabla_\theta\log\pi_\theta
$$

所以：

$$
\nabla_\theta J
=
A\operatorname{sech}^2(z/B)
\nabla_\theta\log\pi_\theta
$$

这里会出现一个完全不同的行为：

$$
r\rightarrow\infty
\quad\Rightarrow\quad
\nabla J\rightarrow0
$$

它表达的思想是：

> 一个样本如果已经严重 off-policy，那么这个样本本身可能已经不值得信任，因此逐渐忽略它。

而前面的 rational saturation：

$$
h_B(r)=\frac{Br}{B-1+r}
$$

表达的是：

> 即使严重 off-policy，我仍然认为这个负反馈是有效的，只是不允许它无限主导更新。

这其实是两种不同的 inductive bias。

---

## 8. 三种方法背后的不同哲学

把它们放在一起看，会非常清楚。

### PPO clipping

$$
\text{越界}
\Rightarrow
\text{部分区域直接停止更新}
$$

### Log-ratio saturation

$$
\text{越离谱}
\Rightarrow
\text{越不相信这个样本}
\Rightarrow
\nabla J\rightarrow0
$$

### Bounded importance gradient

$$
\text{越离谱}
\Rightarrow
\text{仍然纠正}
\Rightarrow
\text{但纠正强度存在上限}
$$

我目前更感兴趣的是第三种。

因为对于：

$$
A<0,\qquad r\gg1
$$

这个样本传递的信息其实是明确的：

> 当前 policy 相比 rollout policy，大幅提高了一个 negative-advantage action 的概率。

完全不给梯度似乎有点浪费。

但让：

$$
r=10^4
$$

产生 \(10^4\) 量级的 importance weighting，又可能让极少数异常 token 对优化产生过大的影响。

所以一个折中的目标是：

$$
\boxed{
\text{Keep the direction, bound the strength.}
}
$$

---

## 9. 一个值得继续验证的问题

当然，上面的构造目前更多是一个 objective-design idea，而不是说它一定比 PPO 更好。

真正需要实验回答的问题很多。

例如：

* \(B\) 应该取多少？
* positive / negative advantage 是否应该使用不同的 \(B\)？
* 是否应该只处理 \(A<0,r>1\) 这个象限？
* 对 GRPO 的 group-relative advantage 有什么影响？
* token-level ratio 的长尾到底有多严重？
* 是否会降低 exploration？
* 是否影响 PPO 原本的 pessimistic surrogate 性质？
* 和直接 gradient norm clipping 相比有什么区别？
* 在 stale rollout / fully-async RL 场景下是否更有价值？

尤其是最后一点。

在 asynchronous RL 中，policy version lag 会天然增加：

$$
\left|
\log\pi_\theta-\log\pi_{\mathrm{old}}
\right|
$$

importance ratio 的长尾问题可能因此更加明显。

这种情况下，与其单纯丢掉 stale trajectory，或让极端 ratio 产生非常大的梯度，也许存在第三种选择：

$$
\boxed{
\text{保留 trajectory，但平滑限制它能施加的最大更新强度。}
}
$$

我觉得这是这个思路最值得继续实验的地方。

---

## 总结

最初的问题其实非常简单：

> **当 \(A<0\) 且 \(r\gg1\) 时，我们真的希望 policy gradient 随着 \(r\) 无限增长吗？**

PPO 的答案基本是：在这个方向上允许，因为 policy 正在严重增加一个 negative-advantage action 的概率。

但另一种可能是：

$$
\boxed{
\text{惩罚应该继续，但惩罚强度不需要无限增长。}
}
$$

于是可以构造：

$$
h_B(r)=\frac{Br}{B-1+r}
$$

以及对应的 smooth surrogate：

$$
\boxed{
J_{\mathrm{smooth}}
=
A
\left[
1+
B\log
\left(
\frac{B-1+r}{B}
\right)
\right]
}
$$

它保留了 advantage 的强化/抑制方向，同时把 effective importance weight 平滑限制在有限范围内。

这未必是最终最优的形式，但我觉得它提供了一个挺直接的视角：

> **PPO 不一定只能在“保留梯度”和“clip 成 0”之间二选一。我们也可以让梯度保留方向，同时让强度平滑饱和。**

这可能尤其适合 importance ratio 长尾明显、policy lag 较大的异步 RL 场景。
