# -*- coding: utf-8 -*-
"""Paint the watercolour eucalyptus sprigs for the cards.

The printed card only exists as a small scan, far too soft to put on a
phone screen, so the two sprigs - one hanging into the top-left corner,
one rising out of the bottom-right - are painted here instead, at print
resolution, in the same pale sage. Each leaf is laid down the way a
watercolour wash dries: pigment pools at the rim, the vein stays light,
and the paper's tooth shows through.

    python art/paint-leaves.py   ->  site/assets/img/leaves-tl.png / .webp
                                     site/assets/img/leaves-br.png / .webp

Deterministic: the same seeds paint the same sprigs every time.
"""
import os
import math
import numpy as np
import cv2
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'site', 'assets', 'img')
PREVIEW = os.environ.get('LEAF_PREVIEW')   # a folder: also drop a preview on white

SAGE = [(150, 176, 160), (163, 186, 170), (138, 165, 152),
        (171, 192, 178), (146, 170, 168), (158, 181, 158)]
STEM = (128, 146, 124)
BUD = (196, 212, 196)


class Canvas:
    """premultiplied RGBA in float, composited with 'over'"""

    def __init__(self, w, h):
        self.w, self.h = w, h
        self.rgb = np.zeros((h, w, 3), np.float32)
        self.a = np.zeros((h, w), np.float32)

    def over(self, x0, y0, color, alpha):
        h, w = alpha.shape
        X0, Y0 = max(0, x0), max(0, y0)
        X1, Y1 = min(self.w, x0 + w), min(self.h, y0 + h)
        if X1 <= X0 or Y1 <= Y0:
            return
        al = alpha[Y0 - y0:Y1 - y0, X0 - x0:X1 - x0]
        if np.ndim(color) == 3:
            col = color[Y0 - y0:Y1 - y0, X0 - x0:X1 - x0]
        else:
            col = np.broadcast_to(np.asarray(color, np.float32), al.shape + (3,))
        a = self.a[Y0:Y1, X0:X1]
        c = self.rgb[Y0:Y1, X0:X1]
        c[:] = col * al[..., None] + c * (1 - al[..., None])
        a[:] = al + a * (1 - al)

    def image(self):
        a = np.clip(self.a, 0, 1)
        rgb = self.rgb / np.maximum(a[..., None], 1e-4)
        rgb = np.where(a[..., None] > 1e-4, rgb, 0)
        out = np.dstack([np.clip(rgb, 0, 255), a * 255]).astype(np.uint8)
        return Image.fromarray(out, 'RGBA')


def smooth_noise(rng, h, w, scale):
    """value noise: a random field blown up to the given feature size"""
    n = rng.standard_normal((max(2, h // scale + 3), max(2, w // scale + 3))).astype(np.float32)
    n = cv2.resize(n, (w, h), interpolation=cv2.INTER_CUBIC)
    return (n - n.mean()) / (n.std() + 1e-6)


def leaf(cv, rng, base, angle, length, width, bend=0.0, opacity=0.6):
    """one watercolour leaf whose stalk end is at `base`, pointing along `angle`"""
    SS = 3
    color = np.array(SAGE[rng.integers(len(SAGE))], np.float32) + rng.normal(0, 4, 3)
    n = 90
    t = np.linspace(0, 1, n)
    prof = np.sin(np.pi * t ** 0.78) ** 0.95 * (1 - 0.15 * t)   # widest below the middle, pointed tip
    wob = 1 + 0.045 * np.convolve(rng.standard_normal(n + 8), np.ones(9) / 9, 'valid')
    asym = 1 + rng.uniform(-0.12, 0.12)
    upper = np.stack([t * length, prof * width / 2 * wob * asym], 1)
    lower = np.stack([t * length, -prof * width / 2 * wob[::-1] / asym], 1)
    mid = np.stack([t * length, np.zeros(n)], 1)

    def arc(p):
        return np.stack([p[:, 0], p[:, 1] + bend * length * (p[:, 0] / length) ** 2], 1)

    upper, lower, mid = arc(upper), arc(lower), arc(mid)
    poly = np.concatenate([upper, lower[::-1]], 0)
    ca, sa = math.cos(angle), math.sin(angle)
    R = np.array([[ca, -sa], [sa, ca]])
    poly = poly @ R.T + base
    mid = mid @ R.T + base

    x0, y0 = (np.floor(poly.min(0)) - 6).astype(int)
    x1, y1 = (np.ceil(poly.max(0)) + 6).astype(int)
    w, h = x1 - x0, y1 - y0
    m = np.zeros((h * SS, w * SS), np.uint8)
    cv2.fillPoly(m, [np.round((poly - [x0, y0]) * SS).astype(np.int32)], 255, lineType=cv2.LINE_AA)
    mask = cv2.resize(m, (w, h), interpolation=cv2.INTER_AREA).astype(np.float32) / 255

    hard = (mask > 0.5).astype(np.uint8)
    d_edge = cv2.distanceTransform(hard, cv2.DIST_L2, 5)
    rib = np.zeros((h, w), np.uint8)
    cv2.polylines(rib, [np.round(mid[5:-6] - [x0, y0]).astype(np.int32)], False, 255, 1, cv2.LINE_AA)
    d_rib = np.minimum(cv2.distanceTransform(255 - rib, cv2.DIST_L2, 5), 1e3)

    low = smooth_noise(rng, h, w, max(6, int(width / 2.6)))
    fine = smooth_noise(rng, h, w, 3)
    rim = np.exp(-d_edge / max(1.5, width * 0.05))
    dens = opacity * (0.84 + 0.11 * low)
    dens *= 1 + 0.55 * rim                                           # pigment pools at the rim
    dens *= 1 - 0.38 * np.exp(-(d_rib / max(1.2, width * 0.035)) ** 2)  # the vein stays pale
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    px, py = xx + x0 - base[0], yy + y0 - base[1]
    side = np.tanh((ca * py - sa * px) / (width * 0.3))
    dens *= 1 + 0.14 * side * rng.choice([-1, 1])                   # the wash ran one way
    dens *= 1 + 0.045 * fine                                         # the paper's tooth
    alpha = np.clip(mask * dens, 0, 0.95)
    tint = color[None, None, :] * (1 + 0.035 * low[..., None]) - 10 * rim[..., None]
    cv.over(int(x0), int(y0), np.clip(tint, 0, 255), alpha)


def stroke(cv, rng, pts, w0, w1, color=STEM, opacity=0.75):
    """a tapering stem along a polyline"""
    pts = np.asarray(pts, np.float32)
    pad = int(w0) + 4
    x0, y0 = (np.floor(pts.min(0)) - pad).astype(int)
    x1, y1 = (np.ceil(pts.max(0)) + pad).astype(int)
    SS = 3
    m = np.zeros(((y1 - y0) * SS, (x1 - x0) * SS), np.uint8)
    n = len(pts)
    for i in range(n - 1):
        wi = w0 + (w1 - w0) * i / max(1, n - 1)
        a = np.round((pts[i] - [x0, y0]) * SS).astype(int)
        b = np.round((pts[i + 1] - [x0, y0]) * SS).astype(int)
        cv2.line(m, (int(a[0]), int(a[1])), (int(b[0]), int(b[1])), 255,
                 max(1, int(round(wi * SS))), cv2.LINE_AA)
    mask = cv2.resize(m, (x1 - x0, y1 - y0), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    col = np.array(color, np.float32) + rng.normal(0, 3, 3)
    cv.over(int(x0), int(y0), col, mask * opacity)


def bezier(p0, p1, p2, p3, n=80):
    t = np.linspace(0, 1, n)[:, None]
    return (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3


def bud(cv, rng, c, r):
    """a small round bud: a pale wash with a soft darker rim"""
    R = int(r + 4)
    yy, xx = np.mgrid[-R:R + 1, -R:R + 1].astype(np.float32)
    d = np.sqrt(xx ** 2 + yy ** 2)
    mask = np.clip(r - d + 0.5, 0, 1)
    rim = np.exp(-np.maximum(r - d, 0) / max(1, r * 0.3))
    alpha = mask * (0.38 + 0.38 * rim)
    col = np.array(BUD, np.float32) - 38 * rim[..., None] + rng.normal(0, 3, 3)
    cv.over(int(c[0]) - R, int(c[1]) - R, np.clip(col, 0, 255), alpha)


def spray(cv, rng, start, angle, length, n_leaves, leaf_len, leaf_w, curl=0.25, leaf_op=0.6):
    """a stem with leaves alternating along it, smaller toward the tip"""
    ca, sa = math.cos(angle), math.sin(angle)
    d = np.array([ca, sa])
    nrm = np.array([-sa, ca])
    p0 = np.array(start, np.float32)
    p1 = p0 + d * length * 0.35 + nrm * length * curl * 0.25
    p2 = p0 + d * length * 0.70 + nrm * length * curl * 0.55
    p3 = p0 + d * length + nrm * length * curl * 0.5
    path = bezier(p0, p1, p2, p3)
    stroke(cv, rng, path, max(1.5, leaf_w * 0.07), 1.0)
    for i in range(n_leaves):
        f = 0.12 + 0.86 * i / max(1, n_leaves - 1)
        k = min(len(path) - 2, int(f * (len(path) - 1)))
        p = path[k]
        tang = path[k + 1] - path[k]
        ta = math.atan2(tang[1], tang[0])
        sgn = 1 if i % 2 == 0 else -1
        spread = math.radians(rng.uniform(32, 55)) * sgn
        scale = 1.0 - 0.45 * f + rng.uniform(-0.08, 0.08)
        L = leaf_len * scale
        stalk = p + np.array([math.cos(ta + spread), math.sin(ta + spread)]) * L * 0.06
        stroke(cv, rng, [p, stalk], max(1.0, leaf_w * 0.05), 1.0)
        leaf(cv, rng, stalk, ta + spread, L, leaf_w * scale * rng.uniform(0.9, 1.1),
             bend=rng.uniform(-0.12, 0.12) * sgn, opacity=leaf_op * rng.uniform(0.85, 1.1))
    tip = path[-1] - path[-4]
    leaf(cv, rng, path[-1], math.atan2(tip[1], tip[0]), leaf_len * 0.5, leaf_w * 0.55,
         bend=0.05, opacity=leaf_op)
    return path


def bud_sprig(cv, rng, start, angle, length, n):
    """a thin stem with little round buds on short stalks"""
    ca, sa = math.cos(angle), math.sin(angle)
    d = np.array([ca, sa])
    nrm = np.array([-sa, ca])
    p0 = np.array(start, np.float32)
    path = bezier(p0, p0 + d * length * 0.4 + nrm * length * 0.06,
                  p0 + d * length * 0.75 - nrm * length * 0.05, p0 + d * length)
    stroke(cv, rng, path, 2.0, 0.9, opacity=0.6)
    for i in range(n):
        f = 0.3 + 0.7 * i / max(1, n - 1)
        k = min(len(path) - 2, int(f * (len(path) - 1)))
        p = path[k]
        tang = path[k + 1] - path[k]
        ta = math.atan2(tang[1], tang[0]) + math.radians(rng.uniform(25, 50)) * (1 if i % 2 else -1)
        q = p + np.array([math.cos(ta), math.sin(ta)]) * rng.uniform(14, 26)
        stroke(cv, rng, [p, q], 1.4, 0.9, opacity=0.55)
        bud(cv, rng, q, rng.uniform(5.5, 8.5))
    bud(cv, rng, path[-1], 7.5)


def save(cv, name):
    img = cv.image()
    os.makedirs(OUT, exist_ok=True)
    img.save(os.path.join(OUT, name + '.png'), optimize=True)
    img.save(os.path.join(OUT, name + '.webp'), quality=60, alpha_quality=60, method=6)
    if PREVIEW:
        bg = Image.new('RGBA', img.size, (255, 255, 255, 255))
        bg.alpha_composite(img)
        bg.convert('RGB').save(os.path.join(PREVIEW, name + '-preview.jpg'), quality=90)
    print(name, img.size, os.path.getsize(os.path.join(OUT, name + '.webp')) // 1024, 'KB webp')


# ---- top left: sprays hanging into the corner from above ------------
rng = np.random.default_rng(23)
tl = Canvas(640, 980)
bud_sprig(tl, rng, (30, -10), math.radians(66), 420, 7)
spray(tl, rng, (-40, 20), math.radians(52), 860, 11, 205, 84, curl=-0.16, leaf_op=0.52)
spray(tl, rng, (40, -50), math.radians(34), 600, 9, 185, 76, curl=0.22, leaf_op=0.55)
spray(tl, rng, (-50, 260), math.radians(74), 640, 8, 175, 70, curl=-0.12, leaf_op=0.46)
spray(tl, rng, (-60, -40), math.radians(18), 420, 6, 170, 70, curl=0.3, leaf_op=0.5)
bud_sprig(tl, rng, (170, 110), math.radians(28), 330, 5)
bud_sprig(tl, rng, (40, 420), math.radians(70), 260, 4)
save(tl, 'leaves-tl')

# ---- bottom right: sprays rising out of the corner -----------------
rng = np.random.default_rng(41)
br = Canvas(620, 1100)
bud_sprig(br, rng, (540, 430), math.radians(-118), 400, 7)
spray(br, rng, (610, 1130), math.radians(-98), 980, 12, 210, 86, curl=0.12, leaf_op=0.56)
spray(br, rng, (690, 880), math.radians(-138), 600, 8, 190, 78, curl=-0.2, leaf_op=0.5)
spray(br, rng, (470, 1150), math.radians(-114), 560, 7, 180, 74, curl=0.25, leaf_op=0.48)
spray(br, rng, (680, 1080), math.radians(-160), 420, 6, 170, 70, curl=-0.25, leaf_op=0.5)
bud_sprig(br, rng, (400, 1010), math.radians(-150), 320, 5)
bud_sprig(br, rng, (600, 690), math.radians(-104), 280, 5)
save(br, 'leaves-br')
