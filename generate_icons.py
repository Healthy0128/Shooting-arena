from pathlib import Path
import struct,zlib

def png(size,path):
    bg=(13,17,24,255); panel=(31,42,60,255); blue=(93,181,255,255); red=(255,91,118,255); white=(245,247,255,255)
    px=[[bg for _ in range(size)] for _ in range(size)]
    def rect(x1,y1,x2,y2,c):
        for y in range(max(0,y1),min(size,y2)):
            for x in range(max(0,x1),min(size,x2)): px[y][x]=c
    m=int(size*.12);rect(m,m,size-m,size-m,panel)
    rect(int(size*.22),int(size*.47),int(size*.78),int(size*.55),blue)
    rect(int(size*.47),int(size*.22),int(size*.55),int(size*.78),red)
    cx=cy=size//2;r=int(size*.13);r2=int(size*.06)
    for y in range(size):
        for x in range(size):
            d=(x-cx)**2+(y-cy)**2
            if d<=r*r:px[y][x]=white
            if d<=r2*r2:px[y][x]=bg
    raw=b''.join(b'\x00'+b''.join(bytes(p) for p in row) for row in px)
    def ch(t,d):
        return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
    data=b'\x89PNG\r\n\x1a\n'+ch(b'IHDR',struct.pack('>IIBBBBB',size,size,8,6,0,0,0))+ch(b'IDAT',zlib.compress(raw,9))+ch(b'IEND',b'')
    Path(path).write_bytes(data)

png(192,'icon-192.png')
png(512,'icon-512.png')
png(180,'apple-touch-icon.png')
