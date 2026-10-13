"""Render the inspected backend architecture as a PNG and an editable SVG."""
from pathlib import Path
from html import escape
import math
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent
W, H = 2400, 2150
im = Image.new('RGB', (W, H), '#f4f7fb')
d = ImageDraw.Draw(im)
svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
       '<rect width="100%" height="100%" fill="#f4f7fb"/>']
fonts = {}

def font(size, bold=False, mono=False):
    key = size, bold, mono
    if key not in fonts:
        name = 'consola.ttf' if mono else ('seguisb.ttf' if bold else 'segoeui.ttf')
        fonts[key] = ImageFont.truetype(str(Path('C:/Windows/Fonts') / name), size)
    return fonts[key]

def rect(x, y, w, h, fill, stroke=None, radius=18):
    d.rounded_rectangle((x, y, x+w, y+h), radius=radius, fill=fill, outline=stroke, width=2)
    svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}" stroke="{stroke or fill}" stroke-width="2"/>')

def text(x, y, value, size=26, color='#334155', bold=False, mono=False):
    f = font(size, bold, mono)
    d.text((x, y), value, font=f, fill=color)
    family = 'Consolas, monospace' if mono else 'Segoe UI, Arial, sans-serif'
    svg.append(f'<text x="{x}" y="{y}" dominant-baseline="text-before-edge" font-family="{family}" font-size="{size}" font-weight="{600 if bold else 400}" fill="{color}">{escape(value)}</text>')

def arrow(points, color='#64748b', dashed=False, both=False):
    if dashed:
        for a, b in zip(points, points[1:]):
            length = math.dist(a, b)
            for t in range(0, int(length), 18):
                p = (a[0]+(b[0]-a[0])*t/length, a[1]+(b[1]-a[1])*t/length)
                t2 = min(t+10, length)
                q = (a[0]+(b[0]-a[0])*t2/length, a[1]+(b[1]-a[1])*t2/length)
                d.line((p, q), fill=color, width=4)
    else:
        d.line(points, fill=color, width=4, joint='curve')
    svg.append(f'<polyline points="{" ".join(f"{x},{y}" for x,y in points)}" fill="none" stroke="{color}" stroke-width="4"'+ (' stroke-dasharray="10 8"' if dashed else '') + '/>')
    def head(a, b):
        ang = math.atan2(b[1]-a[1], b[0]-a[0])
        p = (b[0]-16*math.cos(ang-.45), b[1]-16*math.sin(ang-.45))
        q = (b[0]-16*math.cos(ang+.45), b[1]-16*math.sin(ang+.45))
        d.polygon([b,p,q], fill=color)
        svg.append(f'<polygon points="{b[0]},{b[1]} {p[0]},{p[1]} {q[0]},{q[1]}" fill="{color}"/>')
    head(points[-2], points[-1])
    if both:
        head(points[1], points[0])

def box(x, y, w, h, title, path, lines, tone='blue'):
    colors = {'blue':('#ffffff','#cbd5e1','#2563eb'), 'green':('#f0fdf4','#a7d9bb','#15803d'),
              'purple':('#faf5ff','#d8c5ed','#7e22ce'), 'gray':('#f8fafc','#cbd5e1','#64748b'),
              'amber':('#fffbeb','#e8cf91','#a16207')}
    bg, border, accent = colors[tone]
    rect(x,y,w,h,bg,border)
    rect(x+20,y+23,6,36,accent,radius=3)
    text(x+42,y+20,title,32,accent,True)
    if path:
        text(x+25,y+70,path,23,'#475569',mono=True)
    for i, line in enumerate(lines):
        text(x+25,y+102+i*34,line,25)

text(80,40,'BACKEND2  /  CODE ARCHITECTURE',52,'#0f172a',True)
text(82,109,'Node.js + Express  |  MongoDB / Mongoose  |  Multer + Cloudinary',30)
text(82,163,'Based on the current source. Arrows describe the implemented wiring and intended registration flow.',25,'#64748b')

text(80,223,'01   STARTUP',26,'#475569',True)
box(80,270,440,175,'Development command','package.json',['npm run dev','nodemon src/index.js'])
box(580,270,550,175,'Entry point','src/index.js',['dotenv loads .env','Connect to MongoDB; exit on failure'])
box(1190,270,510,175,'Database connection','mongoose.connect(...)',['MONGODB_URI','Await connection before listening'],'green')
box(1760,270,560,175,'HTTP server','app.listen(PORT || 8000)',['Express app imported from app.js','Start after database is connected'])
arrow([(520,355),(580,355)])
arrow([(1130,355),(1190,355)])
arrow([(1700,355),(1760,355)])

text(80,495,'02   REGISTRATION REQUEST + DATA FLOW',26,'#475569',True)
box(80,545,330,225,'API client','External caller',['multipart/form-data','Text fields + avatar','Optional coverImage'])
box(470,545,540,225,'Express middleware','src/app.js',['CORS; JSON / URL-encoded (20kb)','cookie-parser; public static files','Mount /api/v1/users'])
box(1070,545,500,225,'User router','src/routes/user.routes.js',['POST /api/v1/users/register','upload.fields(...)','Then call userRegister'])
box(1630,545,690,225,'Multipart upload','src/middlewares/multer.js',['Multer diskStorage','avatar (max 1), coverImage (max 1)','Preserve original filename'])
arrow([(410,655),(470,655)])
arrow([(1010,655),(1070,655)])
arrow([(1570,655),(1630,655)])

rect(1630,820,690,92,'#eff6ff','#bfdbfe')
text(1655,837,'public/temp/  |  local upload staging',28,'#1d4ed8',True)
text(1655,876,'Multer writes files; Cloudinary reads these paths.',23)
arrow([(1975,770),(1975,820)])
arrow([(1760,770),(1760,797),(1110,797),(1110,965)])
text(1190,841,'req.body + req.files',25,'#64748b')

box(80,965,550,310,'User persistence','src/models/user.js',['Mongoose User schema + timestamps','username, email, fullname','avatar / coverImage URLs','password hash; refreshToken','watchHistory references videos'],'green')
box(740,965,730,310,'Registration controller','src/controllers/user.js',['Validate fields; check duplicate user','Require avatar; upload images','User.create(...); fetch created user','Exclude password and refreshToken','Return HTTP 201 via ApiResponse'])
box(1630,965,690,310,'Cloudinary helper','src/utils/cloudinary.js',['Upload local file (resource_type: auto)','Return uploaded resource / URL','On upload failure: delete local file','On success: local file is retained','Read Cloudinary env configuration'],'purple')
arrow([(740,1115),(630,1115)],both=True,color='#15803d')
text(644,1058,'query /',21,'#15803d')
text(644,1086,'create',21,'#15803d')
arrow([(1470,1115),(1630,1115)],both=True,color='#7e22ce')
text(1486,1056,'upload /',21,'#7e22ce')
text(1486,1085,'URLs',21,'#7e22ce')
arrow([(2130,912),(2130,965)],color='#7e22ce')

box(80,1350,550,175,'MongoDB','External database',['Users persisted through Mongoose','Video model currently unconnected'],'green')
box(740,1350,730,175,'Response envelope','src/utils/ApiResponse.js',['statusCode, data, message, success','HTTP JSON response returned to caller'])
box(1630,1350,690,175,'Cloudinary','External media service',['Avatar / cover image storage','User records store returned URLs'],'purple')
arrow([(355,1275),(355,1350)],both=True,color='#15803d')
arrow([(1105,1275),(1105,1350)])
arrow([(1975,1275),(1975,1350)],both=True,color='#7e22ce')

text(80,1570,'03   SUPPORTING CODE + UNCONNECTED FEATURES',26,'#475569',True)
box(80,1620,720,215,'Error propagation','src/utils/asynchandler.js + apiError.js',['Wrap async controller; rejection calls next(err)','ApiError carries status, message, errors and stack','No custom Express error middleware is registered'])
box(840,1620,720,215,'Password + token methods','src/models/user.js',['pre-save: bcrypt.hash(password, 10)','Password comparison; JWT method definitions','No login / refresh routes; JWT signing is incomplete'])
box(1600,1620,720,215,'Video model (not imported)','src/models/video.js',['Video metadata, views, owner and timestamps','No video router or controller; stray I identifier','Pagination package imported; plugin not applied'],'gray')

rect(80,1890,2240,175,'#fffbeb','#e8cf91')
text(105,1909,'CURRENT CODE STATUS',27,'#a16207',True)
text(105,1953,'Registration stops at the duplicate check: User.findOne(...) has no await, so its Query object is always truthy.',27)
text(105,1994,'Other mismatches: Cloud_name config key; ApiResponse argument order; JWT secret / expiry arguments.',26)
text(105,2030,'These boxes map the current code structure; the downstream registration path requires those fixes to run successfully.',25)
text(80,2090,'Scope: all 11 src JavaScript files, package.json and public/temp. The gray video model has no connected endpoint.',23,'#64748b')

OUT.mkdir(parents=True, exist_ok=True)
im.save(OUT / 'backend2-architecture.png')
svg.append('</svg>')
(OUT / 'backend2-architecture.svg').write_text('\n'.join(svg), encoding='utf-8')
print(f'Created {OUT / "backend2-architecture.png"} ({W} x {H})')
print(f'Created {OUT / "backend2-architecture.svg"}')
