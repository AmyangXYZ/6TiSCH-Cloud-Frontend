import json

with open('./results-noise-wLDSF.json') as f:
    res = json.load(f)

a = "a"
for i in range(50):
    print("{},{},{},{},{},{},{},{}".format(
        i+1, res["changeParentNodes"][i], res["APAS"]["el"][i], res["APAS"]["sr"][i]*100,
        res["LLSF"]["el"][i], res["LLSF"]["sr"][i]*100,
        res["LDSF"]["el"][i], res["LDSF"]["sr"][i]*100))
