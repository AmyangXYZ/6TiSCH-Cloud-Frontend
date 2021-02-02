import json

with open('./src/components/analysis/results-noise-new.json') as f:
    data = json.load(f)
# d = ['1']*25+['2']*40+['3']*25+['4']*15+['5']*4
for i in range(51):
    print("{},{},{},{},{},{},{},{}".format((1+i),
                                            data['partition']['avg_latency'][i], data['partition']['avg_rtt'][i],data['partition']['sr'][i],
                                            data['llsf']['avg_latency'][i], data['llsf']['avg_rtt'][i],data['llsf']['sr'][i],
                                            data['change_parent'][i]))
