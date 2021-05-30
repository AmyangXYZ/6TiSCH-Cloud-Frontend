/*eslint-disable*/
var scheduler = require('./scheduler-apas')
// var scheduler = require('./scheduler-apasp')
// var scheduler1row = require('./scheduler')
// var scheduler_block = require('./scheduler-block')

function get_partition() {
  var p = []
  sch = sch1
  p.push({type:"beacon", layer:0, range:[sch.partition.broadcast.start,sch.partition.broadcast.end]})
  p.push({type:"control", layer:0, range:[sch.partition.control.start,sch.partition.control.end]})
  for(var l=0;l<Object.keys(sch.partition[0].uplink).length;l++) {
    for(var r=0;r<sch1.rows;r++) {
      p.push({type:'uplink',layer:l, row:r, channels:sch.partition[r].uplink[l].channels, range:[sch.partition[r].uplink[l].start,sch.partition[r].uplink[l].end]})
      p.push({type:'downlink',layer:l, row:r, channels:sch.partition[r].downlink[l].channels, range:[sch.partition[r].downlink[l].start,sch.partition[r].downlink[l].end]})
    }
  }
  // console.log(p)
  return p
}

function get_partition1row() {
  var p = []
  p.push({type:"beacon", layer:0, range:[sch2.partition.broadcast.start,sch2.partition.broadcast.end]})
  for(var l=0;l<Object.keys(sch2.partition.uplink).length;l++) {
      p.push({type:'uplink',layer:l, range:[sch2.partition.uplink[l].start,sch2.partition.uplink[l].end]})
      p.push({type:'downlink',layer:l, range:[sch2.partition.downlink[l].start,sch2.partition.downlink[l].end]})
     
  }
  return p
}

var sch1={}
var sch2={}
var sch3={}
var sch4={}
var sch5={}
var sch6={}
var topo = {}
var join_seq = []

const LINK_OPTION_COAP = 1

// static schedule, init
function static_schedule1() {
  for(var i=0;i<join_seq.length;i++) {
    var node = join_seq[i]
    var parent = topo[node].parent
    var layer = topo[node].layer

    var ret=sch1.find_empty_subslot([node],8,{type:"beacon",layer:0});
    sch1.add_subslot(ret.slot, ret.subslot, {type:"beacon",layer:layer,row:ret.row, sender:node,receiver:0xffff}, ret.is_optimal);

    // tx for control packets
    var ret=sch1.find_empty_subslot([node,parent],1,{type:"uplink",layer:layer});
    sch1.add_subslot(ret.slot, ret.subslot, {type:"uplink",layer:layer,row:ret.row,sender:node,receiver:parent}, ret.is_optimal);    
    var ret=sch1.find_empty_subslot([parent, node],1,{type:"downlink",layer:layer});
    sch1.add_subslot(ret.slot, ret.subslot, {type:"downlink",layer:layer,row:ret.row,sender:parent,receiver:node}, ret.is_optimal);

    // tx for coap packets
    var ret=sch1.find_empty_subslot([node,parent],1,{type:"uplink",layer:layer, option: LINK_OPTION_COAP});
    sch1.add_subslot(ret.slot, ret.subslot, {type:"uplink",layer:layer,row:ret.row,sender:node,receiver:parent, option: LINK_OPTION_COAP}, ret.is_optimal);    
    var ret=sch1.find_empty_subslot([parent, node],1,{type:"downlink",layer:layer, option: LINK_OPTION_COAP});
    sch1.add_subslot(ret.slot, ret.subslot, {type:"downlink",layer:layer,row:ret.row,sender:parent,receiver:node, option: LINK_OPTION_COAP}, ret.is_optimal);
  }
}

function static_schedule2() {
  for(var i=0;i<join_seq.length;i++) {
    var node = join_seq[i]
    var parent = topo[node].parent
    var layer = topo[node].layer

    // var ret=sch2.find_empty_subslot([node],8,{type:"beacon",layer:0});
    // sch2.add_subslot(ret.slot, ret.subslot, {type:"beacon",layer:layer,row:ret.row, sender:node,receiver:0xffff}, ret.is_optimal);

    var ret=sch2.find_empty_subslot([node,parent],1,{type:"uplink",layer:layer});
    if(ret!=null)
      sch2.add_subslot(ret.slot, ret.subslot, {type:"uplink",layer:layer,row:ret.row,sender:node,receiver:parent}, ret.is_optimal);    
    var ret=sch2.find_empty_subslot([parent, node],1,{type:"downlink",layer:layer});
    if(ret!=null)
      sch2.add_subslot(ret.slot, ret.subslot, {type:"downlink",layer:layer,row:ret.row,sender:parent,receiver:node}, ret.is_optimal);
  }
}

function static_schedule3() {
  for(var i=0;i<join_seq.length;i++) {
    var node = join_seq[i]
    var parent = topo[node].parent
    var layer = topo[node].layer

    var ret=sch3.find_empty_subslot([node],8,{type:"beacon",layer:0});
    sch3.add_subslot(ret.slot, ret.subslot, {type:"beacon",layer:layer,row:ret.row, sender:node,receiver:0xffff}, ret.is_optimal);

    var ret=sch3.find_empty_subslot([node,parent],1,{type:"uplink",layer:layer});
    sch3.add_subslot(ret.slot, ret.subslot, {type:"uplink",layer:layer,row:ret.row,sender:node,receiver:parent}, ret.is_optimal);    
    var ret=sch3.find_empty_subslot([parent, node],1,{type:"downlink",layer:layer});
    sch3.add_subslot(ret.slot, ret.subslot, {type:"downlink",layer:layer,row:ret.row,sender:parent,receiver:node}, ret.is_optimal);
  }
}

function static_schedule4() {
  var max_hop = 0
  for(var x=0;x<join_seq.length;x++) {
    var node = join_seq[x]
    if ((topo[node].path.length-1)>max_hop)
      max_hop = topo[node].path.length-1
  }
  console.log("max hop", max_hop)
  for(var i=0;i<join_seq.length;i++) {
    var node = join_seq[i]
    var parent = topo[node].parent
    var layer = topo[node].layer

    // var ret=sch3.find_empty_subslot([node],8,{type:"beacon",layer:0});
    // sch3.add_subslot(ret.slot, ret.subslot, {type:"beacon",layer:layer,row:ret.row, sender:node,receiver:0xffff}, ret.is_optimal);
    var hop = topo[node].path.length-1
    for(var j=0;j<max_hop+1-hop;j++) {
      var ret=sch4.find_empty_subslot([node,parent],1,{type:"uplink",layer:layer});
      if(ret!=null)
        sch4.add_subslot(ret.slot, ret.subslot, {type:"uplink",layer:layer,row:ret.row,sender:node,receiver:parent}, ret.is_optimal);    
      else
        console.log("cannot find an optimal cell")
    }
    // var ret=sch4.find_empty_subslot([parent, node],1,{type:"downlink",layer:layer});
    // if(ret!=null)
    //   sch4.add_subslot(ret.slot, ret.subslot, {type:"downlink",layer:layer,row:ret.row,sender:parent,receiver:node}, ret.is_optimal);
    // else
    //   console.log("cannot find an optimal cell")
  }
}

function static_schedule5() {
  for(var i=0;i<join_seq.length;i++) {
    var node = join_seq[i]
    var parent = topo[node].parent
    var layer = topo[node].layer

    // var ret=sch3.find_empty_subslot([node],8,{type:"beacon",layer:0});
    // sch3.add_subslot(ret.slot, ret.subslot, {type:"beacon",layer:layer,row:ret.row, sender:node,receiver:0xffff}, ret.is_optimal);

    var ret=sch5.find_empty_subslot([node,parent],1,{type:"uplink",layer:layer});
    if(ret!=null)
      sch5.add_subslot(ret.slot, ret.subslot, {type:"uplink",layer:layer,row:ret.row,sender:node,receiver:parent}, ret.is_optimal);    
    else
      console.log("cannot find an optimal cell")
    var ret=sch5.find_empty_subslot([parent, node],1,{type:"downlink",layer:layer});
    if(ret!=null)
      sch5.add_subslot(ret.slot, ret.subslot, {type:"downlink",layer:layer,row:ret.row,sender:parent,receiver:node}, ret.is_optimal);
    else
      console.log("cannot find an optimal cell")
  }
}

function static_schedule6() {
  for(var i=0;i<join_seq.length;i++) {
    var node = join_seq[i]
    var parent = topo[node].parent
    var layer = topo[node].layer

    var ret=sch6.find_empty_subslot([node],8,{type:"beacon",layer:0});
    sch6.add_subslot(ret.slot, ret.subslot, {type:"beacon",layer:layer, sender:node,receiver:0xffff}, ret.is_optimal);

    var ret=sch6.find_empty_subslot([node,parent],1,{type:"uplink",layer:layer});
    sch6.add_subslot(ret.slot, ret.subslot, {type:"uplink",layer:layer, sender:node,receiver:parent}, ret.is_optimal);    
    var ret=sch6.find_empty_subslot([parent, node],1,{type:"downlink",layer:layer});
    sch6.add_subslot(ret.slot, ret.subslot, {type:"downlink",layer:layer,sender:parent,receiver:node}, ret.is_optimal);
  }
}

// rm old links, add new links
function dynamic_schedule(node) {
  // add new up/downlink
  var ret=sch1.find_empty_subslot([node.id,node.parent],1,{type:"uplink",layer:node.layer});
  sch1.add_subslot(ret.slot, ret.subslot, {row:ret.row,type:"uplink",layer:node.layer,sender:node.id,receiver:node.parent}, ret.is_optimal);

  ret=sch1.find_empty_subslot([node.parent, node.id],1,{type:"downlink",layer:node.layer});
  sch1.add_subslot(ret.slot, ret.subslot, {row:ret.row, type:"downlink",layer:node.layer,sender:node.parent,receiver:node.id}, ret.is_optimal);
  
  // var ret=sch2.find_empty_subslot([node.id,node.parent],1,{type:"uplink",layer:node.layer});
  // sch2.add_subslot(ret.slot, ret.subslot, {row:ret.row,type:"uplink",layer:node.layer,sender:node.id,receiver:node.parent}, ret.is_optimal);

  // ret=sch2.find_empty_subslot([node.parent, node.id],1,{type:"downlink",layer:node.layer});
  // sch2.add_subslot(ret.slot, ret.subslot, {row:ret.row, type:"downlink",layer:node.layer,sender:node.parent,receiver:node.id}, ret.is_optimal);

  // var ret=sch3.find_empty_subslot([node.id,node.parent],1,{type:"uplink",layer:node.layer});
  // sch3.add_subslot(ret.slot, ret.subslot, {row:ret.row,type:"uplink",layer:node.layer,sender:node.id,receiver:node.parent}, ret.is_optimal);

  // ret=sch3.find_empty_subslot([node.parent, node.id],1,{type:"downlink",layer:node.layer});
  // sch3.add_subslot(ret.slot, ret.subslot, {row:ret.row, type:"downlink",layer:node.layer,sender:node.parent,receiver:node.id}, ret.is_optimal);

  // var ret=sch4.find_empty_subslot([node.id,node.parent],1,{type:"uplink",layer:node.layer});
  // sch4.add_subslot(ret.slot, ret.subslot, {row:ret.row,type:"uplink",layer:node.layer,sender:node.id,receiver:node.parent}, ret.is_optimal);

  // ret=sch4.find_empty_subslot([node.parent, node.id],1,{type:"downlink",layer:node.layer});
  // sch4.add_subslot(ret.slot, ret.subslot, {row:ret.row, type:"downlink",layer:node.layer,sender:node.parent,receiver:node.id}, ret.is_optimal);

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

function kick4(nodes) {
  var used_subslot = JSON.parse(JSON.stringify(sch4.used_subslot));
  // console.log(used_subslot.length)
  // rm old up/downlink
  for(var i=0;i<nodes.length;i++ ) {
    node = nodes[i]
    for(var j=0;j<used_subslot.length;j++) {
      if((used_subslot[j].cell.type=="uplink"&&used_subslot[j].cell.sender==node) ||
        (used_subslot[j].cell.type=="downlink"&&used_subslot[j].cell.receiver==node)) {
        sch4.remove_slot({slot_offset:used_subslot[j].slot[0],channel_offset:used_subslot[j].slot[1]})
      }
    }
  }
}

function init1(topology,seq) {
  sch1 = scheduler.create_scheduler(150,[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],"partition")

  topo = topology
  // topo for scheduler, {parent: [children]}
  var sch_topo = {0:[]}
  for(var n=1;n<Object.keys(topo).length;n++) {
    if(sch_topo[topo[n].parent]!=null) sch_topo[topo[n].parent].push(n)
    else sch_topo[topo[n].parent] = [n]
  }
  // sch1.setTopology(sch_topo)
  join_seq = seq
  // sort_join_seq()
  static_schedule1()
  
  var n1 = sch1.count_used_slotss()
  var n2 = sch1.count_multi_ch_slots()
  // console.log("2D PART uses", n1, "slots, and", n2,"slots","("+(n2/n1*100.0).toFixed(2)+"%)", "use multiple channels")
  // sch.dynamic_partition_adjustment()
  return {cells:sch1.used_subslot, partitions: get_partition(), n1:n1, n2:n2}
}

function init2(topology,seq) {
  sch2 = scheduler.create_scheduler(127,[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16], "LLSF")
  
  // topo = topology
  // topo for scheduler, {parent: [children]}
  // var sch_topo = {0:[]}
  // for(var n=1;n<Object.keys(topo).length;n++) {
  //   if(sch_topo[topo[n].parent]!=null) sch_topo[topo[n].parent].push(n)
  //   else sch_topo[topo[n].parent] = [n]
  // }
  // sch2.setTopology(sch_topo)
  join_seq = seq
  static_schedule2()
  var n1 = sch2.count_used_slots()
  var n2 = sch2.count_multi_ch_slots()
  // console.log("1D PART uses", n1, "slots, and", n2,"slots","("+(n2/n1*100.0).toFixed(2)+"%)", "use multiple channels")
  // sch.dynamic_partition_adjustment()
  return {cells:sch2.used_subslot,  n1:n1, n2:n2}
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

function init4(topology,seq) {
  sch4 = scheduler.create_scheduler(127,[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],"LDSF")

  topo = topology
  // topo for scheduler, {parent: [children]}
  var sch_topo = {0:[]}
  for(var n=1;n<Object.keys(topo).length;n++) {
    if(sch_topo[topo[n].parent]!=null) sch_topo[topo[n].parent].push(n)
    else sch_topo[topo[n].parent] = [n]
  }
  // sch1.setTopology(sch_topo)
  join_seq = seq
  static_schedule4()
  var n1 = sch4.count_used_slotss()
  var n2 = sch4.count_multi_ch_slots()
  // console.log("2D PART uses", n1, "slots, and", n2,"slots","("+(n2/n1*100.0).toFixed(2)+"%)", "use multiple channels")
  // sch.dynamic_partition_adjustment()
  return {cells:sch4.used_subslot, n1:n1, n2:n2}
}

function init5(topology,seq) {
  sch4 = scheduler.create_scheduler(127,[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],"block")

  topo = topology
  // topo for scheduler, {parent: [children]}
  var sch_topo = {0:[]}
  for(var n=1;n<Object.keys(topo).length;n++) {
    if(sch_topo[topo[n].parent]!=null) sch_topo[topo[n].parent].push(n)
    else sch_topo[topo[n].parent] = [n]
  }
  // sch1.setTopology(sch_topo)
  join_seq = seq
  static_schedule4()

  return {cells:sch5.used_subslot}
}


function init6(topology,seq) {
  sch6 = scheduler.create_scheduler(127,[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],"partition+")

  topo = topology
  // topo for scheduler, {parent: [children]}
  var sch_topo = {0:[]}
  for(var n=1;n<Object.keys(topo).length;n++) {
    if(sch_topo[topo[n].parent]!=null) sch_topo[topo[n].parent].push(n)
    else sch_topo[topo[n].parent] = [n]
  }
  // sch1.setTopology(sch_topo)
  join_seq = seq
  static_schedule6()

  return {cells:sch6.used_subslot, partitions: get_partition()}
}

function get_sch() {
  return {cells:sch1.used_subslot, partitions: get_partition()}
}
function get_sch2() {
  return {cells:sch2.used_subslot}
}
function get_sch3() {
  return {cells:sch3.used_subslot}
}

function get_sch4() {
  return {cells:sch4.used_subslot}
}

function get_sch5() {
  return {cells:sch5.used_subslot}
}

function get_sch6() {
  return {cells:sch5.used_subslot}
}

function sort_join_seq() {
  // console.log(topo)

  var arr_1 = []
  for(var l=0;l<6;l++) {
    var p_c = {}
    for(var n=1;n<Object.keys(topo).length;n++) {
      if(topo[n].layer==l) {
        p_c[n] = 0
        for(var nn=1;nn<Object.keys(topo).length;nn++) {
          if(topo[nn].parent == n) p_c[n]++
        }
      }
    }
    
    var sorted = Object.keys(p_c).sort(function(a,b){return p_c[b]-p_c[a]})
    // console.log(p_c)
    // console.log(sorted)
    Array.prototype.push.apply(arr_1, sorted)
  }

  // console.log(arr_1)
  join_seq = arr_1
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
  sch1.setTopology(sch_topo)
  
  l++
  edits += sch1.intra_partition_adjustment("uplink", l)
  
  if(l==5) l = -1
  
  // // console.log(sch.get_idles_all())
  // sch.dynamic_partition_adjustment()
  return {cells:sch1.used_subslot, partitions: get_partition(), edits}
}

function inter_partition_adjustment() {
  sch1.adjust_unaligned_cells()
  return {cells:sch1.used_subslot, partitions: get_partition()}
}

function get_scheduler() {
  return sch6
}

module.exports={
  init1: init1,
  init2: init2,
  init3: init3,
  init4: init4,
  init5: init5,
  init6: init6,
  intra_partition_adjustment: intra_partition_adjustment,
  inter_partition_adjustment: inter_partition_adjustment,
  kick: kick,
  kick2: kick2,
  kick3: kick3,
  kick4: kick4,
  dynamic_schedule: dynamic_schedule,
  get_scheduler: get_scheduler,
  get_sch: get_sch,
  get_sch2: get_sch2,
  get_sch3: get_sch3,
  get_sch4: get_sch4,
  get_sch5: get_sch5,
  get_sch6: get_sch6,
  foo: foo
};
