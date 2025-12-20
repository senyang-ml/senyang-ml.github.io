#!/usr/bin/env python3
"""
将data/目录下的JSON文件同步到js/data.js
用于保持内联数据与JSON源文件一致
"""

import json
import os

def read_json(file_path):
    """读取JSON文件"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def generate_data_js():
    """生成data.js文件"""
    
    # 读取JSON文件
    profile = read_json('data/profile.json')
    experience = read_json('data/experience.json')
    publications = read_json('data/publications.json')
    
    # 生成JavaScript内容
    js_content = '''// 内联数据 - 用于静态部署（无需服务器）
// 当通过file://协议访问或fetch失败时使用
// 此文件由 update_data.py 自动生成，请勿手动编辑

window.DATA_PROFILE = ''' + json.dumps(profile, ensure_ascii=False, indent=2) + ''';

window.DATA_EXPERIENCE = ''' + json.dumps(experience, ensure_ascii=False, indent=2) + ''';

window.DATA_PUBLICATIONS = ''' + json.dumps(publications, ensure_ascii=False, indent=2) + ''';
'''
    
    # 写入文件
    with open('js/data.js', 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print("✅ 已成功同步数据到 js/data.js")
    print(f"   - Profile: {len(str(profile))} 字符")
    print(f"   - Experience: {len(str(experience))} 字符")
    print(f"   - Publications: {len(publications['papers'])} 篇论文")

if __name__ == '__main__':
    try:
        generate_data_js()
    except FileNotFoundError as e:
        print(f"❌ 错误: 找不到文件 {e.filename}")
        print("请确保在项目根目录运行此脚本")
    except json.JSONDecodeError as e:
        print(f"❌ JSON格式错误: {e}")
    except Exception as e:
        print(f"❌ 发生错误: {e}")
