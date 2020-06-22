# DPA 

1. 最少的edit，将schedule变为aligned
2. 最少edit，调整partition gap
支持移动parent branch，平移分区

先排低层，低层先满足optimal，否则所有层都unoptimal

如果处于第2/3行且低层，children多，没有地方平移，将parent和某个U0-0的cell替换位置

如果已经non-optimal，则所有三行都已经满，首先测试能否将最下行左移

P1: 

## Cases

1. no cross row links: 直接平移
2. 存在unaligned, 但是在

## 副作用

1. conflict, same rx,tx in one slot
2. non optimal, latency increase