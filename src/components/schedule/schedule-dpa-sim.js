/*eslint-disable*/
var scheduler = require('./scheduler-multi-row')

function get_partition() {
  var p = []
  p.push({type:"beacon", layer:0, range:[sch.partition.broadcast.start,sch.partition.broadcast.end]})
  // for(var i=0;i<Object.keys(sch.partition.uplink).length;i++) {
  for(var i=0;i<Object.keys(sch.partition[0].uplink).length;i++) {
    // p.push({type:'uplink',layer:i, row:0, range:[sch.partition.uplink[i].start,sch.partition.uplink[i].end]})
    p.push({type:'uplink',layer:i, row:0, range:[sch.partition[0].uplink[i].start,sch.partition[0].uplink[i].end]})
    p.push({type:'uplink',layer:i, row:1, range:[sch.partition[1].uplink[i].start,sch.partition[1].uplink[i].end]})
    p.push({type:'uplink',layer:i, row:2, range:[sch.partition[2].uplink[i].start,sch.partition[2].uplink[i].end]})
    
    // p.push({type:'downlink',layer:i, row:0, range:[sch.partition.downlink[i].start,sch.partition.downlink[i].end]})
    p.push({type:'downlink',layer:i, row:0, range:[sch.partition[0].downlink[i].start,sch.partition[0].downlink[i].end]})
    p.push({type:'downlink',layer:i, row:1, range:[sch.partition[1].downlink[i].start,sch.partition[1].downlink[i].end]})
    p.push({type:'downlink',layer:i, row:2, range:[sch.partition[2].downlink[i].start,sch.partition[2].downlink[i].end]})
  }
  // console.log(sch.partition)
  return p
}

var sch={}
var topo = {}
var join_seq = []

// static schedule, init
function static_schedule() {
  
  for(var i=0;i<join_seq.length;i++) {
    var node = join_seq[i]
    var parent = topo[node].parent
    var layer = topo[node].layer

    // var ret=sch.find_empty_subslot([node],16,{type:"beacon",layer:0});
    // sch.add_subslot(ret.slot, ret.subslot, {type:"beacon",layer:layer,row:ret.row, sender:node,receiver:0xffff}, ret.is_optimal);

    var ret=sch.find_empty_subslot([node,parent],1,{type:"uplink",layer:layer});
    sch.add_subslot(ret.slot, ret.subslot, {type:"uplink",layer:layer,row:ret.row,sender:node,receiver:parent}, ret.is_optimal);
    
    // var ret=sch.find_empty_subslot([parent, node],1,{type:"downlink",layer:layer});
    // sch.add_subslot(ret.slot, ret.subslot, {type:"downlink",layer:layer,row:ret.row,sender:parent,receiver:node}, ret.is_optimal);
  }
}

// rm old links, add new links
function dynamic_schedule(node) {
  // add new up/downlink
  var ret=sch.find_empty_subslot([node.id,node.parent],1,{type:"uplink",layer:node.layer});
  sch.add_subslot(ret.slot, ret.subslot, {row:ret.row,type:"uplink",layer:node.layer,sender:node.id,receiver:node.parent}, ret.is_optimal);

  // ret=sch.find_empty_subslot([node.parent, node.id],1,{type:"downlink",layer:node.layer});
  // sch.add_subslot(ret.slot, ret.subslot, {row:ret.row, type:"downlink",layer:node.layer,sender:node.parent,receiver:node.id}, ret.is_optimal);
  return ret.is_optimal
}

function kick(nodes) {
  var used_subslot = JSON.parse(JSON.stringify(sch.used_subslot));
  // console.log(used_subslot.length)
  // rm old up/downlink
  for(var i=0;i<nodes.length;i++ ) {
    node = nodes[i]
    for(var j=0;j<used_subslot.length;j++) {
      if((used_subslot[j].cell.type=="uplink"&&used_subslot[j].cell.sender==node) ||
        (used_subslot[j].cell.type=="downlink"&&used_subslot[j].cell.receiver==node)) {
        sch.remove_slot({slot_offset:used_subslot[j].slot[0],channel_offset:used_subslot[j].slot[1]})
      }
    }
  }
}

function init(topology,seq) {
  sch = scheduler.create_scheduler(127,[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16])
  // sch = scheduler.create_scheduler(127,[1,3,5,7,9,11,13,15])
  
  topo = topology
  join_seq = seq
  static_schedule()
  // sch.dynamic_partition_adjustment()
  // sch.dynamic_partition_adjustment()
  return {cells:sch.used_subslot, partitions: get_partition()}
}

function get_sch() {
  return {cells:sch.used_subslot, partitions: get_partition()}
}

function foo() {
  // sch.adjust_partition_offset('uplink',0,-37)
  // sch.adjust_partition_offset('downlink',0,37)
}

function dpa() { 
  console.log("trigger DPA")
  // console.log(sch.get_idles_all())
  sch.dynamic_partition_adjustment()
  return {cells:sch.used_subslot, partitions: get_partition()}
}

function get_scheduler() {
  return sch
}

module.exports={
  init: init,
  dpa: dpa,
  kick: kick,
  dynamic_schedule: dynamic_schedule,
  get_scheduler: get_scheduler,
  get_sch: get_sch,
  foo: foo
};
