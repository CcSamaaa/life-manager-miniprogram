# -*- coding: utf-8 -*-
# 生成底部导航栏图标：今天(日历) / 功能(2x2宫格) / 我的(人形)
# 输出 assets/tabbar/ 下各 2 张 PNG（普通灰、选中绿），81x81，透明背景
import os
from PIL import Image, ImageDraw

OUT = os.path.join(os.path.dirname(__file__), "assets", "tabbar")
os.makedirs(OUT, exist_ok=True)

SIZE = 81
GRAY = (154, 160, 166, 255)
GREEN = (7, 193, 96, 255)


def new_canvas():
    return Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))


def draw_calendar(color):
    img = new_canvas()
    d = ImageDraw.Draw(img)
    # 外框
    d.rounded_rectangle([16, 20, 65, 68], radius=10, outline=color, width=5)
    # 顶部装订环
    d.line([(31, 12), (31, 24)], fill=color, width=5)
    d.line([(50, 12), (50, 24)], fill=color, width=5)
    # 表头分隔
    d.line([(20, 33), (61, 33)], fill=color, width=4)
    # 日期点阵（2 行 x 3 列）
    positions = [(28, 45), (40, 45), (52, 45), (28, 57), (40, 57), (52, 57)]
    for (x, y) in positions:
        d.ellipse([x - 4, y - 4, x + 4, y + 4], fill=color)
    return img


def draw_grid(color):
    img = new_canvas()
    d = ImageDraw.Draw(img)
    cells = [(15, 15), (45, 15), (15, 45), (45, 45)]
    for (x, y) in cells:
        d.rounded_rectangle([x, y, x + 21, y + 21], radius=6, fill=color)
    return img


def draw_person(color):
    img = new_canvas()
    d = ImageDraw.Draw(img)
    # 头
    d.ellipse([28, 14, 53, 39], fill=color)
    # 肩（上半椭圆）
    d.pieslice([10, 44, 71, 110], 180, 360, fill=color)
    return img


ICONS = {
    "today": draw_calendar,
    "feature": draw_grid,
    "mine": draw_person,
}

for name, fn in ICONS.items():
    fn(GRAY).save(os.path.join(OUT, name + ".png"))
    fn(GREEN).save(os.path.join(OUT, name + "-active.png"))
    print("generated", name)

print("ALL_DONE")
