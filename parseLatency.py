import json
import requests



# with open("latency.json") as f:
#     data = json.load(f)["data"]
# print(requests.get("http://pi4/api/any/nwstat").content)
data = requests.get("http://pi4/api/any/nwstat").json()["data"]
topo = requests.get("http://pi4/api/any/topology").json()["data"]

data = sorted(data, key=lambda k: k['sensor_id'])

total = 0

def findLayer(id):
    layer = 1
    parent = 0
    for i in topo:
        if i["sensor_id"] == id:
            parent = i["parent"]
            break

    while(parent != 1):
        for i in topo:
            if i["sensor_id"] == parent:
                parent = i["parent"]
                layer += 1
                break

    return layer

print("ID,LAYER,LATENCY")
j = []
for i in data:
    layer = findLayer(i["sensor_id"])
    j.append({"id":i["sensor_id"], "layer":layer, "latency":i["e2e_latency_avg"]})
    total += i["e2e_latency_avg"]
    print("%d,%d,%f"%(i["sensor_id"], layer, i["e2e_latency_avg"]))
print("avg:",total/49)

out_file = open("lat.json", "w")
  
json.dump(j, out_file, indent = 6)
  
out_file.close()


# print(findLayer(45))
