/*eslint-disable*/
var scheduler = require('./scheduler-multi-row')

function get_partition() {
  var p = []
  p.push({type:"beacon", layer:0, range:[sch1.partition.broadcast.start,sch1.partition.broadcast.end]})
  for(var l=0;l<Object.keys(sch1.partition[0].uplink).length;l++) {
    for(var r=0;r<3;r++) {
      p.push({type:'uplink',layer:l, row:r, range:[sch1.partition[r].uplink[l].start,sch1.partition[r].uplink[l].end]})
      p.push({type:'downlink',layer:l, row:r, range:[sch1.partition[r].downlink[l].start,sch1.partition[r].downlink[l].end]})
    }
  }
  // console.log(sch.partition)
  return p
}

var sch1={}
var sch2={}
var sch3={}
var topo = {}
var join_seq = []

// static schedule, init
function static_schedule1() {
  for(var i=0;i<join_seq.length;i++) {
    var node = join_seq[i]
    var parent = topo[node].parent
    var layer = topo[node].layer

    // var ret=sch.find_empty_subslot([node],16,{type:"beacon",layer:0});
    // sch.add_subslot(ret.slot, ret.subslot, {type:"beacon",layer:layer,row:ret.row, sender:node,receiver:0xffff}, ret.is_optimal);

    var ret=sch1.find_empty_subslot([node,parent],1,{type:"uplink",layer:layer});
    sch1.add_subslot(ret.slot, ret.subslot, {type:"uplink",layer:layer,row:ret.row,sender:node,receiver:parent}, ret.is_optimal);    
    var ret=sch1.find_empty_subslot([parent, node],1,{type:"downlink",layer:layer});
    sch1.add_subslot(ret.slot, ret.subslot, {type:"downlink",layer:layer,row:ret.row,sender:parent,receiver:node}, ret.is_optimal);
  }
}

function static_schedule2() {
  for(var i=0;i<join_seq.length;i++) {
    var node = join_seq[i]
    var parent = topo[node].parent
    var layer = topo[node].layer

    // var ret=sch.find_empty_subslot([node],16,{type:"beacon",layer:0});
    // sch.add_subslot(ret.slot, ret.subslot, {type:"beacon",layer:layer,row:ret.row, sender:node,receiver:0xffff}, ret.is_optimal);

    var ret=sch2.find_empty_subslot([node,parent],1,{type:"uplink",layer:layer});
    sch2.add_subslot(ret.slot, ret.subslot, {type:"uplink",layer:layer,row:ret.row,sender:node,receiver:parent}, ret.is_optimal);    
    var ret=sch2.find_empty_subslot([parent, node],1,{type:"downlink",layer:layer});
    sch2.add_subslot(ret.slot, ret.subslot, {type:"downlink",layer:layer,row:ret.row,sender:parent,receiver:node}, ret.is_optimal);
  }
}

function static_schedule3() {
  for(var i=0;i<join_seq.length;i++) {
    var node = join_seq[i]
    var parent = topo[node].parent
    var layer = topo[node].layer

    // var ret=sch.find_empty_subslot([node],16,{type:"beacon",layer:0});
    // sch.add_subslot(ret.slot, ret.subslot, {type:"beacon",layer:layer,row:ret.row, sender:node,receiver:0xffff}, ret.is_optimal);

    var ret=sch3.find_empty_subslot([node,parent],1,{type:"uplink",layer:layer});
    sch3.add_subslot(ret.slot, ret.subslot, {type:"uplink",layer:layer,row:ret.row,sender:node,receiver:parent}, ret.is_optimal);    
    var ret=sch3.find_empty_subslot([parent, node],1,{type:"downlink",layer:layer});
    sch3.add_subslot(ret.slot, ret.subslot, {type:"downlink",layer:layer,row:ret.row,sender:parent,receiver:node}, ret.is_optimal);
  }
}

// rm old links, add new links
function dynamic_schedule(node) {
  // add new up/downlink
  var ret=sch1.find_empty_subslot([node.id,node.parent],1,{type:"uplink",layer:node.layer});
  sch1.add_subslot(ret.slot, ret.subslot, {row:ret.row,type:"uplink",layer:node.layer,sender:node.id,receiver:node.parent}, ret.is_optimal);

  ret=sch1.find_empty_subslot([node.parent, node.id],1,{type:"downlink",layer:node.layer});
  sch1.add_subslot(ret.slot, ret.subslot, {row:ret.row, type:"downlink",layer:node.layer,sender:node.parent,receiver:node.id}, ret.is_optimal);
  
  var ret=sch2.find_empty_subslot([node.id,node.parent],1,{type:"uplink",layer:node.layer});
  sch2.add_subslot(ret.slot, ret.subslot, {row:ret.row,type:"uplink",layer:node.layer,sender:node.id,receiver:node.parent}, ret.is_optimal);

  ret=sch2.find_empty_subslot([node.parent, node.id],1,{type:"downlink",layer:node.layer});
  sch2.add_subslot(ret.slot, ret.subslot, {row:ret.row, type:"downlink",layer:node.layer,sender:node.parent,receiver:node.id}, ret.is_optimal);

  // var ret=sch3.find_empty_subslot([node.id,node.parent],1,{type:"uplink",layer:node.layer});
  // sch3.add_subslot(ret.slot, ret.subslot, {row:ret.row,type:"uplink",layer:node.layer,sender:node.id,receiver:node.parent}, ret.is_optimal);

  // ret=sch3.find_empty_subslot([node.parent, node.id],1,{type:"downlink",layer:node.layer});
  // sch3.add_subslot(ret.slot, ret.subslot, {row:ret.row, type:"downlink",layer:node.layer,sender:node.parent,receiver:node.id}, ret.is_optimal);
  return ret.is_optimal
}

function kick(nodes) {
  var used_subslot = JSON.parse(JSON.stringify(sch1.used_subslot));
  // console.log(used_subslot.length)
  // rm old up/downlink
  for(var i=0;i<nodes.length;i++ ) {
    node = nodes[i]
    for(var j=0;j<used_subslot.length;j++) {
      if((used_subslot[j].cell.type=="uplink"&&used_subslot[j].cell.sender==node) ||
        (used_subslot[j].cell.type=="downlink"&&used_subslot[j].cell.receiver==node)) {
        sch1.remove_slot({slot_offset:used_subslot[j].slot[0],channel_offset:used_subslot[j].slot[1]})
      }
    }
  }
}

function kick2(nodes) {
  var used_subslot = JSON.parse(JSON.stringify(sch2.used_subslot));
  // console.log(used_subslot.length)
  // rm old up/downlink
  for(var i=0;i<nodes.length;i++ ) {
    node = nodes[i]
    for(var j=0;j<used_subslot.length;j++) {
      if((used_subslot[j].cell.type=="uplink"&&used_subslot[j].cell.sender==node) ||
        (used_subslot[j].cell.type=="downlink"&&used_subslot[j].cell.receiver==node)) {
        sch2.remove_slot({slot_offset:used_subslot[j].slot[0],channel_offset:used_subslot[j].slot[1]})
      }
    }
  }
}

function kick3(nodes) {
  var used_subslot = JSON.parse(JSON.stringify(sch3.used_subslot));
  // console.log(used_subslot.length)
  // rm old up/downlink
  for(var i=0;i<nodes.length;i++ ) {
    node = nodes[i]
    for(var j=0;j<used_subslot.length;j++) {
      if((used_subslot[j].cell.type=="uplink"&&used_subslot[j].cell.sender==node) ||
        (used_subslot[j].cell.type=="downlink"&&used_subslot[j].cell.receiver==node)) {
        sch3.remove_slot({slot_offset:used_subslot[j].slot[0],channel_offset:used_subslot[j].slot[1]})
      }
    }
  }
}

function init1(topology,seq) {
  sch1 = scheduler.create_scheduler(127,[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],"partition")
  
  topo = topology
  // topo for scheduler, {parent: [children]}
  var sch_topo = {0:[]}
  for(var n=1;n<Object.keys(topo).length;n++) {
    if(sch_topo[topo[n].parent]!=null) sch_topo[topo[n].parent].push(n)
    else sch_topo[topo[n].parent] = [n]
  }
  sch1.setTopology(sch_topo)
  join_seq = seq
  static_schedule1()
  // sch.dynamic_partition_adjustment()
  return {cells:sch1.used_subslot, partitions: get_partition()}
}

function init2(topology,seq) {
  sch2 = scheduler.create_scheduler(127,[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],"LLSF")
  
  topo = topology
  // topo for scheduler, {parent: [children]}
  var sch_topo = {0:[]}
  for(var n=1;n<Object.keys(topo).length;n++) {
    if(sch_topo[topo[n].parent]!=null) sch_topo[topo[n].parent].push(n)
    else sch_topo[topo[n].parent] = [n]
  }
  sch2.setTopology(sch_topo)
  join_seq = seq
  static_schedule2()
  // sch.dynamic_partition_adjustment()
  return {cells:sch2.used_subslot, partitions: get_partition()}
}

function init3(topology,seq) {
  sch3 = scheduler.create_scheduler(127,[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],"random")
  
  topo = topology
  // topo for scheduler, {parent: [children]}
  var sch_topo = {0:[]}
  for(var n=1;n<Object.keys(topo).length;n++) {
    if(sch_topo[topo[n].parent]!=null) sch_topo[topo[n].parent].push(n)
    else sch_topo[topo[n].parent] = [n]
  }
  sch3.setTopology(sch_topo)
  join_seq = seq
  static_schedule3()
  // sch.dynamic_partition_adjustment()
  return {cells:sch3.used_subslot, partitions: get_partition()}
}

function get_sch() {
  return {cells:sch1.used_subslot, partitions: get_partition()}
}
function get_sch2() {
  return {cells:sch2.used_subslot, partitions: get_partition()}
}
function get_sch3() {
  return {cells:sch3.used_subslot, partitions: get_partition()}
}

function foo() {
  // sch.adjust_partition_offset('uplink',0,-37)
  // sch.adjust_partition_offset('downlink',0,37)
}
l = -1
function intra_partition_adjustment(topology) {
  var edits = 0
  var sch_topo = {0:[]}
  // topo for scheduler, {parent: [children]}
  for(var n=1;n<Object.keys(topology).length;n++) {
    if(sch_topo[topology[n].parent]!=null) sch_topo[topology[n].parent].push(n)
    else sch_topo[topology[n].parent] = [n]
  }
  sch.setTopology(sch_topo)
  
  l++
  edits += sch.intra_partition_adjustment("uplink", l)
  
  if(l==5) l = -1
  
  // // console.log(sch.get_idles_all())
  // sch.dynamic_partition_adjustment()
  return {cells:sch.used_subslot, partitions: get_partition(), edits}
}

function inter_partition_adjustment() {
  sch.adjust_unaligned_cells()
  return {cells:sch.used_subslot, partitions: get_partition()}
}

function get_scheduler() {
  return sch1
}

module.exports={
  init1: init1,
  init2: init2,
  init3: init3,
  intra_partition_adjustment: intra_partition_adjustment,
  inter_partition_adjustment: inter_partition_adjustment,
  kick: kick,
  kick2: kick2,
  kick3: kick3,
  dynamic_schedule: dynamic_schedule,
  get_scheduler: get_scheduler,
  get_sch: get_sch,
  get_sch2: get_sch2,
  get_sch3: get_sch3,
  foo: foo
};
