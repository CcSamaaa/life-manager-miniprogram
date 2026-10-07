from PIL import Image, ImageDraw
import math, os

S = 144
img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
cx = cy = S // 2

# ── P1 外层：双箭头循环（类似刷新图标）深浅绿 ──
r_out = 62
w_out = 10
dark_green = (8, 80, 65, 255)      # 外环深绿
light_green = (29, 158, 117, 255)   # 内环浅绿

# 上半弧 + 右箭头（顺时针方向）
d.arc([cx-r_out, cy-r_out, cx+r_out, cy+r_out], -30, 150, fill=dark_green, width=w_out)
# 右侧箭头头部
ax1 = cx + r_out * math.cos(math.radians(150))
ay1 = cy + r_out * math.sin(math.radians(150))
ax2 = cx + r_out * math.cos(math.radians(120))
ay2 = cy + r_out * math.sin(math.radians(120))
ax3 = cx + (r_out+10) * math.cos(math.radians(135))
ay3 = cy + (r_out+10) * math.sin(math.radians(135))
d.polygon([(ax1, ay1), (ax3, ay3), (ax2, ay2)], fill=dark_green)

# 下半弧 + 左箭头（顺时针方向）
r_mid = 48
d.arc([cx-r_mid, cy-r_mid, cx+r_mid, cy+r_mid], 150, 330, fill=light_green, width=w_out-2)
# 左侧箭头头部
bx1 = cx + r_mid * math.cos(math.radians(330))
by1 = cy + r_mid * math.sin(math.radians(330))
bx2 = cx + r_mid * math.cos(math.radians(300))
by2 = cy + r_mid * math.sin(math.radians(300))
bx3 = cx + (r_mid-9) * math.cos(math.radians(315))
by3 = cy + (r_mid-9) * math.sin(math.radians(315))
d.polygon([(bx1, by1), (bx3, by3), (bx2, by2)], fill=light_green)

# ── P2 内层：红色圆角边框 + 空心对勾 ──
red = (226, 75, 74, 255)
box_size = 36
box_x = cx - box_size // 2
box_y = cy - box_size // 2
rr = 7  # 圆角半径
# 圆角矩形边框（用四条线段+四个圆角近似）
d.line([box_x+rr, box_y, box_x+box_size-rr, box_y], fill=red, width=3)
d.line([box_x+rr, box_y+box_size, box_x+box_size-rr, box_y+box_size], fill=red, width=3)
d.line([box_x, box_y+rr, box_x, box_y+box_size-rr], fill=red, width=3)
d.line([box_x+box_size, box_y+rr, box_x+box_size, box_y+box_size-rr], fill=red, width=3)
# 四个圆角
for ox, oy in [(box_x+rr, box_y+rr), (box_x+box_size-rr, box_y+rr),
               (box_x+rr, box_y+box_size-rr), (box_x+box_size-rr, box_y+box_size-rr)]:
    d.ellipse([ox-rr, oy-rr, ox+rr, oy+rr], outline=red, width=3)

# 红色空心对勾（在边框内部居中）
w_chk = 4
chk_cx, chk_cy = cx, cy + 1
pts = [
    (chk_cx - 9, chk_cy + 2),
    (chk_cx - 2, chk_cy + 9),
    (chk_cx + 11, chk_cy - 6),
]
d.line([pts[0], pts[1]], fill=red, width=w_chk, joint="curve")
d.line([pts[1], pts[2]], fill=red, width=w_chk, joint="curve")

# 输出到脚本所在目录下的 assets/，换电脑、改文件夹名都不用改这里
base_dir = os.path.dirname(os.path.abspath(__file__))
assets_dir = os.path.join(base_dir, "assets")
os.makedirs(assets_dir, exist_ok=True)
out_path = os.path.join(assets_dir, "cc-habit-avatar.png")
img.save(out_path, "PNG")
print(f"saved {S}x{S} -> {out_path}")
print(f"size: {os.path.getsize(out_path)} bytes")
