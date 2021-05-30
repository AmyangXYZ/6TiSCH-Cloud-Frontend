import xxhash

for i in range(10):
    print(i, xxhash.xxh32(xxhash.xxh32('1-'+str(i)+'-1').hexdigest()).intdigest() % 10)