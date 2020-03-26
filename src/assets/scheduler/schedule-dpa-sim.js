/*eslint-disable*/
var scheduler = require('./scheduler')

function get_partition() {
  var p = []
  p.push({type:"beacon", layer:0, range:[sch.partition.broadcast.start,sch.partition.broadcast.end]})
  for(var i=0;i<Object.keys(sch.partition.uplink).length;i++) {
    p.push({type:'uplink',layer:i,range:[sch.partition.uplink[i].start,sch.partition.uplink[i].end]})
    p.push({type:'downlink',layer:i,range:[sch.partition.downlink[i].start,sch.partition.downlink[i].end]})
  }
  return p
}

var sch={}

var topo = {}

// static schedule
function static_schedule() {
  for(var i=1;i<Object.keys(topo).length;i++) {
    var node = i  
    var parent = topo[i].parent
    var layer = topo[i].layer

    var ret=sch.find_empty_subslot([node],16,{type:"beacon",layer:0});
    sch.add_subslot(ret.slot, ret.subslot, {type:"beacon",layer:layer,sender:node,receiver:0xffff}, ret.is_optimal);

    var ret=sch.find_empty_subslot([node,parent],1,{type:"uplink",layer:layer});
    sch.add_subslot(ret.slot, ret.subslot, {type:"uplink",layer:layer,sender:node,receiver:parent}, ret.is_optimal);

    var ret=sch.find_empty_subslot([parent, node],1,{type:"downlink",layer:layer});
    sch.add_subslot(ret.slot, ret.subslot, {type:"downlink",layer:layer,sender:parent,receiver:node}, ret.is_optimal);
  }
  
  sch.init_finished = 1
}

// rm old links, add new links
function dynamic_schedule(node, parent, layer) {
  var used_subslot = JSON.parse(JSON.stringify(sch.used_subslot));
  // console.log(used_subslot.length)
  // rm old up/downlink
  for(var j=0;j<used_subslot.length;j++) {
    if((used_subslot[j].cell.type=="uplink"&&used_subslot[j].cell.sender==node) ||
      (used_subslot[j].cell.type=="downlink"&&used_subslot[j].cell.receiver==node)) {
      sch.remove_slot({slot_offset:used_subslot[j].slot[0],channel_offset:used_subslot[j].slot[1]})
    }
  }
  // add new up/downlink
  var ret=sch.find_empty_subslot([node,parent],1,{type:"uplink",layer:layer});
  sch.add_subslot(ret.slot, ret.subslot, {type:"uplink",layer:layer,sender:node,receiver:parent}, ret.is_optimal);

  ret=sch.find_empty_subslot([parent, node],1,{type:"downlink",layer:layer});
  sch.add_subslot(ret.slot, ret.subslot, {type:"downlink",layer:layer,sender:parent,receiver:node}, ret.is_optimal);
}

function change_topo(nodes) {
  for(var i=0;i<nodes.length;i++) {
    dynamic_schedule(nodes[i].id,nodes[i].parent,nodes[i].layer)
  }
}

function init(topology) {
  sch = scheduler.create_scheduler(127,[1,3,5,7,9,11,13,15])
  
  topo = topology
  static_schedule()
  sch.dynamic_partition_adjustment()
  return {cells:sch.used_subslot, partitions: get_partition()}
}

function get_sch() {
  return {cells:sch.used_subslot, partitions: get_partition()}
}

function dpa() { 
  console.log("trigger DPA")
  sch.dynamic_partition_adjustment()
  return {cells:sch.used_subslot, partitions: get_partition()}
}

module.exports={
  init: init,
  dpa: dpa,
  get_sch: get_sch,
  change_topo: change_topo
};
