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

// generate random topology
var topo = {1:0}
function gen_topo() {
  // topo = require('./topo-sim.json')
  if(Object.keys(topo).length<2) { 
    for(var i=2;i<144;i++) {
      var node = i
      parent = Math.round(i*Math.random())
      while(node==parent||parent<=0) {
        parent = Math.round(i*Math.random())
      }
      
      if(node<10) parent = 1
      if(10<node&&node<40) parent = Math.round((9)*Math.random()+1)
      if(40<node&&node<70) parent = Math.round((5)*Math.random()+20)
      // if(60<node&&node<80) parent = Math.round((50)*Math.random()+1)
      topo[node] = parent
    }
  }
}

// fs.writeFile("topo-sim.json",JSON.stringify(topo),'utf8',(err)=>{})

// static schedule
function static_schedule() {
  for(var i=2;i<=Object.keys(topo).length;i++) {
    var node = i  
    var parent = topo[i]
    var layer = 0; thenode = parent
    while(thenode!=1) {
      thenode = topo[thenode]
      layer++
    }

    var ret=sch.find_empty_subslot([node],16,{type:"beacon",layer:0});
    sch.add_subslot(ret.slot, ret.subslot, {type:"beacon",layer:layer,sender:node,receiver:0xffff}, ret.is_optimal);

    var ret=sch.find_empty_subslot([node,parent],1,{type:"uplink",layer:layer});
    sch.add_subslot(ret.slot, ret.subslot, {type:"uplink",layer:layer,sender:node,receiver:parent}, ret.is_optimal);

    var ret=sch.find_empty_subslot([parent, node],1,{type:"downlink",layer:layer});
    sch.add_subslot(ret.slot, ret.subslot, {type:"downlink",layer:layer,sender:parent,receiver:node}, ret.is_optimal);
  }
  sch.reset_partition_changes()
  sch.init_finished = 1
}

// rm old links, add new links
function dynamic_schedule(node, parent, layer) {
  console.log('re-schedule',node,parent,layer)
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

// randomly change topo
function change_topo(reason) {
  var used_subslot = JSON.parse(JSON.stringify(sch.used_subslot));
  var layer = 0
  var start = Math.round((70)*Math.random()+2)
  var end = Math.round((40)*Math.random()+start)
  console.log(end-start,"nodes need to be re-scheduled")
  for(var i=start;i<end;i++) {
    var node = i
    var pass = 0
    while(!pass) {
      var parent = Math.round((i)*Math.random())
      while(node==parent||parent<=0) {
        parent = Math.round(i*Math.random())
      }
      layer = 0
      topo[i] = parent
      var thenode = parent
      while(thenode!=1) {
        thenode = topo[thenode]
        layer++
        if(layer>=8) {
          pass = 0
          break
        }
      }
      if(layer<8) pass=1
    }
    
    setTimeout((n,p,l)=>{
      dynamic_schedule(n,p,l)
      },1000*(i-start),node,parent,layer)
  }
}

function init() {
  sch = scheduler.create_scheduler(127,[1,3,5,7,9,11,13,15])
  gen_topo()
  static_schedule()
  // sch.dynamic_partition_adjustment()
  return {cells:sch.used_subslot, partitions: get_partition()}
}

function shuffle() {
  change_topo()
}

function get_partition_changes() {
  return sch.partition_changes
}

function get_sch() {
  return {cells:sch.used_subslot, partitions: get_partition()}
}

function dpa() { 
  sch.dynamic_partition_adjustment()
}

module.exports={
  init: init,
  dpa: dpa,
  shuffle: shuffle,
  get_sch: get_sch,
  get_partition_changes: get_partition_changes,
};

// var i = 0
// setInterval(()=>{
//   if(i%2==0)changeTopo()
//   else sch.dynamic_partition_adjustment()
//   send()
//   i++
// },5000)

