/*eslint-disable*/
var scheduler = require('./scheduler-block')

var sch={}

var topo = {}
var join_seq = []

// static schedule, init
function static_schedule() {
  for(var i=0;i<join_seq.length;i++) {
    var node = join_seq[i]
    var parent = topo[node].parent
    var layer = topo[node].layer

    var ret=sch.find_empty_subslot([node],8,{type:"beacon",layer:0});
    sch.add_subslot(ret.slot, ret.subslot, {type:"beacon",layer:layer, sender:node,receiver:0xffff}, ret.hard);

    var ret=sch.find_empty_subslot([node,parent],1,{type:"uplink",layer:layer});
    sch.add_subslot(ret.slot, ret.subslot, {type:"uplink",layer:layer,sender:node,receiver:parent}, ret.hard);    

    // var ret=sch.find_empty_subslot([parent, node],1,{type:"downlink",layer:layer});
    // sch.add_subslot(ret.slot, ret.subslot, {type:"downlink",layer:layer,row:ret.row,sender:parent,receiver:node}, ret.is_optimal);
  }
}


// rm old links, add new links
function dynamic_schedule(node) {
  // add new up/downlink
  var ret=sch.find_empty_subslot([node.id,node.parent],1,{type:"uplink",layer:node.layer});
  sch.add_subslot(ret.slot, ret.subslot, {row:ret.row,type:"uplink",layer:node.layer,sender:node.id,receiver:node.parent}, ret.is_optimal);

  ret=sch.find_empty_subslot([node.parent, node.id],1,{type:"downlink",layer:node.layer});
  sch.add_subslot(ret.slot, ret.subslot, {row:ret.row, type:"downlink",layer:node.layer,sender:node.parent,receiver:node.id}, ret.is_optimal);
  
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


function init(topology,seq) {
  sch = scheduler.create_scheduler(127,[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],"block")
  topo = topology
  join_seq = seq
  static_schedule()
  return {cells:sch.used_subslot}
}

function get_sch() {
  return {cells:sch.used_subslot}
}
function get_scheduler() {
  return sch
}

module.exports={
  init: init,
  kick: kick,
  dynamic_schedule: dynamic_schedule,
  get_scheduler: get_scheduler,
  get_sch: get_sch,
};
