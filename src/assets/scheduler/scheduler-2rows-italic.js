/*eslint-disable*/
/*
 * Copyright (c) 2016, Texas Instruments Incorporated
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * *  Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *
 * *  Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * *  Neither the name of Texas Instruments Incorporated nor the names of
 *    its contributors may be used to endorse or promote products derived
 *    from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
 * OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
 * OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
 * EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/* APIs:
  this.find_empty_subslot=function(nodes_list, period, info)
  this.add_subslot=function(slot,subslot,cell)
  this.remove_node=function(node)
  this.dynamic_partition_adjustment()
*/


const RESERVED=0; //Number of reserved
const SUBSLOTS=16;
const partition_config = require("./partition.json");
const RAND = 0;
const PART = 1;
const PARTPLUS = 2;
const OFFSET = 0; // offset of 2 rows
var algorithm = PART;

var partition=null;
function partition_init(sf){
  partition_config.uplink_total=0;
  partition_config.downlink_total=0;
  for(var i in partition_config.uplink){
    partition_config.uplink_total+=partition_config.uplink[i];
  }
  for(var i in partition_config.downlink){
    partition_config.downlink_total+=partition_config.downlink[i];
  }

  //Beacon reserved version
  var u_d = [59,58];
  // var u_d = [sf-partition_config.beacon,sf-partition_config.beacon]
  // partition_scale(u_d, sf-RESERVED-partition_config.beacon);
  var uplink = partition_config.uplink.slice();
  partition_scale(uplink, u_d[0]);
  var downlink = partition_config.downlink.slice();
  partition_scale(downlink, u_d[1]);

  //now we have everything scaled by slotframe length
  //and start do the partition
  var cur_r0 = RESERVED;
  var cur_r1 = RESERVED;
  // 2 rows
  var partition={
    broadcast:{},
    '0': {
      uplink:{},
      downlink:{}
    },
    '1': {
      uplink:{},
      downlink:{}
    }
  };
/*  partition.broadcast={start:cur, end:cur+b_u_d[0]};
  cur+=b_u_d[0];*/

  //Beacon reserved version
  partition.broadcast={start:cur_r0, end:cur_r0+partition_config.beacon};
  cur_r0+=partition_config.beacon;
  cur_r1+=partition_config.beacon
  // cur_d = cur_u

  // uplink
  for(var i=uplink.length-1; i>=0; --i){
    partition[0].uplink[i]={start:cur_r0, end:cur_r0+uplink[i]};
    partition[1].uplink[i]={start:cur_r1, end:cur_r0+uplink[i]*2};
    cur_r1 = cur_r0+uplink[i]*2
    cur_r0+=uplink[i];
  }
  
  // downlink
  cur_r0 = 127
  cur_r1 = 127
  for(var i=downlink.length-1; i>=0; --i){
    partition[0].downlink[i]={start:cur_r0-downlink[i], end:cur_r0};
    partition[1].downlink[i]={start:cur_r0-downlink[i]*2, end:cur_r1};
    cur_r1 = cur_r0-downlink[i]*2
    cur_r0-=downlink[i];
  }
  partition[1].uplink[0].end = partition[0].uplink[0].end
  partition[1].downlink[0].start = partition[0].downlink[0].start
  // partition = align_rows(partition, OFFSET)

  console.log("patition:", partition);
  return partition;
}

function partition_scale(list, size){
  //scale the list to the size (sum(list)==size)
  var total=0;
  for(var i=0; i<list.length; ++i){
    total+=list[i];
  }
  for(var i=0; i<list.length; ++i){
    list[i]=list[i]*size/total;
  }
  //Now we need to arrange them to integers. We cannot directly floor or round or ceil
  //These will cause the sum!=size
  //we do the following 3 for's to round the boundary to closest integers
  for(var i=1; i<list.length; ++i){
    list[i]+=list[i-1];
  }
  for(var i=0; i<list.length; ++i){
    list[i]=Math.floor(list[i]+0.5);
  }
  for(var i=list.length-1; i>0; --i){
    list[i]-=list[i-1];
  }
  return list;
}

function align_rows(partition, offset) {
  var u_d = [59,58]
  var uplink = partition_config.uplink.slice();
  partition_scale(uplink, u_d[0]);
  var downlink = partition_config.downlink.slice();
  partition_scale(downlink, u_d[1]);

  for(var i=uplink.length-1; i>0; --i){
    partition[1].uplink[i]={start:partition[0].uplink[i-1].start-offset, end:partition[0].uplink[i-1].end-offset}
  }
  for(var i=1; i<downlink.length-1; ++i){
    partition[1].downlink[i]={start:partition[0].downlink[i+1].start-offset, end:partition[0].downlink[i+1].end-offset}
  }

  partition[1].uplink[0]=partition[0].downlink[0]
  partition[1].uplink[1].end=partition[0].uplink[0].end
  partition[1].downlink[0]={start:partition[0].downlink[1].start, end:partition[0].downlink[1].end-offset}
  partition[1].downlink[downlink.length-2].end = 127
  partition[1].downlink[downlink.length-1]={start:partition[0].uplink[uplink.length-1].start, end:partition[0].uplink[uplink.length-1].end-offset}

  return partition
}

function create_scheduler(sf,ch){
/*
Slot = {slot_offset, channel}
Subslot = {period, offset}
Cell = {type, sender, receiver}
*/
  // sf = 127
  if(!(this instanceof create_scheduler)){
    return new create_scheduler(sf,ch);
  }
  
  console.log("create_scheduler("+sf+","+ch+")");
  this.slotFrameLength=sf;
  this.channels=ch;
  this.rows = 2
  this.schedule = new Array(sf);
  // mainly for send cells to cloud
  this.used_subslot = []
  this.isFull = false;
  this.nonOptimalCount = 0;
  for(var i=0;i<sf;++i){
    this.schedule[i]=new Array(16);
  }
  for(var c in this.channels){
    var ch=this.channels[c];
    for(var slot=0;slot<this.slotFrameLength;++slot){
      this.schedule[slot][ch]=new Array(SUBSLOTS)
    }
  }

  //initialize partition
  this.partition = partition_init(sf);
  this.init_finished = 0
  // partition changes stat
  // this.partition_changes = {}
  // for(var p in this.partition.uplink) {
  //   this.partition_changes['u'+p] = {count:0,name:'u'+p,has_idle:0}
  //   this.partition_changes['d'+p] = {count:0,name:'d'+p,has_idle:0}
  // }
  
  this.add_slot=function(slot,cell){
    this.add_subslot(slot, {offset:0, period:1}, cell);
  }

  this.add_subslot=function(slot,subslot,cell, is_optimal){
    var sub_start = subslot.offset * SUBSLOTS/subslot.period;
    var sub_end = (subslot.offset+1) * SUBSLOTS/subslot.period;
  
    this.used_subslot.push({slot:[slot.slot_offset, slot.channel_offset],subslot:[subslot.offset,subslot.period],cell:cell,is_optimal: is_optimal})

    // if(cell.type!="beacon")
    //   this.partition_changes[cell.type[0]+cell.layer].count++

    for(var sub = sub_start; sub < sub_end; ++sub){
      this.schedule[slot.slot_offset][slot.channel_offset][sub]={
        type: cell.type,
        layer: cell.layer,
        sender:cell.sender,
        receiver:cell.receiver,
        is_optimal: is_optimal,
      }
    }
  }

  this.remove_slot=function(slot){
    this.remove_subslot(slot, {offset:0, period:1});
  }

  this.remove_subslot=function(slot,subslot){
    var sub_start = subslot.offset * SUBSLOTS/subslot.period;
    var sub_end = (subslot.offset+1) * SUBSLOTS/subslot.period;
    for(var sub = sub_start; sub < sub_end; ++sub){
      this.schedule[slot.slot_offset][slot.channel_offset][sub] = null;
    }

    for(var i=0;i<this.used_subslot.length;i++) {
      if(this.used_subslot[i].slot[0]==slot.slot_offset &&
          this.used_subslot[i].slot[1]==slot.channel_offset &&
          this.used_subslot[i].subslot[0]==subslot.offset && 
          this.used_subslot[i].subslot[1]==subslot.period) {
        // if(this.used_subslot[i].cell.type!="beacon") 
        //   this.partition_changes[this.used_subslot[i].cell.type[0]+this.used_subslot[i].cell.layer].count--
        this.used_subslot.splice(i,1)
        i--
      }
    }
  }

  // find the first(uplink)/last(downlink) used slot of the node
  this.find_slot_index=function(node,type,layer) {
    var start0 = this.partition[0][type][layer].start
    var end0 = this.partition[0][type][layer].end
    
    var start1 = this.partition[1][type][layer].start
    var end1 = this.partition[1][type][layer].end

    var slots = []
    for(var i=start0;i<end0;i++) {
        slots.push(i)
    }
    for(var i=start1;i<end1;i++) {
        slots.push(i)
    }
    slots = Array.from(new Set(slots)).sort()

    if(type=="uplink") {
      for(var s=0;s<slots.length;s++) {
        slot = slots[s]
        for(var ch=1;ch<=this.channels.length;ch++) {
          if(this.schedule[slot][ch][0]!=null) {
            if(this.schedule[slot][ch][0].sender==node) {
              return slot
            }
          }
        }
      }
    } else if(type=="downlink") {
      for(var s=slots.length-2;s>=0;s--) {
        slot = slots[s]
        for(var ch=1;ch<=this.channels.length;ch++) {
          if(this.schedule[slot][ch][0]!=null) {
            if(this.schedule[slot][ch][0].receiver==node) {
              return slot
            }
          }
        }
      }
    }
  }

  //3-d filter
  //flag=1: check order
  this.available_subslot=function(nodes_list,slot,subslot,info,flag){
    if(slot.slot_offset<RESERVED)return false;

    //if is beacon, we want it always the first channel in the list;
    //it actually doesn't matter since hardware-wise it's hardcoded to beacon channel
    //but to make it consistant in scheduler table...
    if(info.type=="beacon" && slot.channel_offset!=this.channels[0])return false;

    //Beacon reserved version: broadcast partition can only be utilized by beacon
    if(this.partition.broadcast!=null){
      var start=this.partition.broadcast.start;
      var end=this.partition.broadcast.end;
      if(info.type=="beacon"){
        if(slot.slot_offset<start||slot.slot_offset>=end)return false;
      }else{
        if(slot.slot_offset>=start&&slot.slot_offset<end)return false;
      }
    }
    
    //check if this slot-channel is assigned
    var sub_start = subslot.offset * SUBSLOTS/subslot.period;
    var sub_end = (subslot.offset+1) * SUBSLOTS/subslot.period;
    for(var sub = sub_start; sub < sub_end; ++sub){
      if(this.schedule[slot.slot_offset][slot.channel_offset][sub]!=null) {
        return false;
      }
    }
  

    //check if this slot (any channel) is assigned to beacon
    //or is assigned to the members
    for(var c in this.channels){
      var ch=this.channels[c];
      for(var sub = sub_start; sub < sub_end; ++sub){
        if(this.schedule[slot.slot_offset][ch][sub]==null)
          continue;
        if(info.type=="beacon")//if allocating beacon, must be a dedicated slot, no freq reuse (potential conflict)
          return false;
        //KILBYIIOT-6, beacon is no longer monitored after association:  
        //Tao: this is added back, since it can cause potential conflict
        if(this.schedule[slot.slot_offset][ch][sub].type=="beacon")
          return false;
        if(nodes_list.indexOf(this.schedule[slot.slot_offset][ch][sub].sender)!=-1)
          return false;
        if(nodes_list.indexOf(this.schedule[slot.slot_offset][ch][sub].receiver)!=-1)
          return false;
      }
    }

    if(flag && info.layer>0) {
      if(info.type!="beacon") {
        var parent = 0
        if(info.type=="uplink") parent = nodes_list[1]
        else parent = nodes_list[0]

        var parent_slot = this.find_slot_index(parent, info.type, info.layer-1)
        if(info.type=="uplink") {
          if(slot.slot_offset>parent_slot) return false
        } else {
          // last downlink partition, next row
          if(Math.abs(slot.slot_offset-parent_slot)>60) return true
          if(slot.slot_offset<parent_slot) return false
        }
      }
    }
    return true;
  }

  // generate a slot list inside the partition.
  // flag=0: normal case, find in_partition slots
  // flag=1: assign non-optimal slots in layer 0 reserved area
  // flag=2: return huge slots list to find the needed size to 
  //         assign all its non-optimal slots back.
  this.inpartition_slots=function(flag,info,row){
    // console.log("Partition schedule locating: "+info.type+", layer="+info.layer)
    var inpartition_slots=[];//result slot list

    var start=0;
    var end=0;
    if(info.type=="beacon"){
      if(this.partition.broadcast!=null){
        start=this.partition.broadcast.start;
        end=this.partition.broadcast.end;
      }
    }
    if(info.type=="uplink"){
      if(this.partition[row].uplink!=null&&this.partition[row].uplink[info.layer.toString()]!=null){
        start=this.partition[row].uplink[info.layer.toString()].start;
        end=this.partition[row].uplink[info.layer.toString()].end;
      }
    }
    if(info.type=="downlink"){
      if(this.partition[row].downlink!=null&&this.partition[row].downlink[info.layer.toString()]!=null){
        start=this.partition[row].downlink[info.layer.toString()].start;
        end=this.partition[row].downlink[info.layer.toString()].end;
      }
    }
    
    // var m=Math.floor((start+end)/2);    
    // expand partition size
    if(flag==2) {
      if(info.type=="uplink") end+=30
      else start-=30
    }
    
    //sorted slot offset list, from edge
    //if first layer tricks, from center
    var partition_slot_list=[];
    for(var i=0;i<end-start;++i){
      partition_slot_list.push(0);
    }

    // flag==0: if try to find optimal slots
    if(flag==0 || flag==2) {
      if(info.layer==0) {
        if(info.type=="uplink"){
          //uplink 0, as late as possible
          for(var i=0;i<end-start;i++){
            partition_slot_list[i]=end-1-i;
          }
        } else {
          // downlink 0, as early as possible
          for(var i=0;i<end-start;++i){
            partition_slot_list[i]=start+i;
          }
        }
      } else {
        if(row==0)  {
          // as late as possible
          for(var i=0;i<end-start;i++){
            partition_slot_list[i]=end-1-i;
          }
        } else {
          // as early as possible
          for(var i=0;i<end-start;++i){
            partition_slot_list[i]=start+i;
          }
        }
      }
      
    } else if(flag==1){
      // flag==1: find available slots in reserved area (layer 0 other channels)
      // from edge to center
      if(info.type=="uplink"){
        //uplink 0, as late as possible
        for(var i=0;i<end-start;i++){
          partition_slot_list[i]=end-1-i;
        }
      } else {
        // downlink 0, as early as possible
        for(var i=0;i<end-start;++i){
          partition_slot_list[i]=start+i;
        }
      }
    }

    //generate slot list
    for(var i=0;i<end-start;++i){
      var slot=partition_slot_list[i];
      if(flag==0 || flag==2) {
        if(info.type=="beacon"){
          inpartition_slots.push({slot_offset:slot, channel_offset:this.channels[0]});
        }else{
          if(row==0) {
            for(var j=0;j<this.channels.length/2;j++){
              var ch=this.channels[j];
              inpartition_slots.push({slot_offset:slot, channel_offset:ch});
            }
          } else if(row==1) {
            for(var j=this.channels.length-1;j>=this.channels.length/2;j--){
              var ch=this.channels[j];
              inpartition_slots.push({slot_offset:slot, channel_offset:ch});
            }
          }
          
        }
      // find available slots in reserved area (layer 0 other channels)
      } else if(flag==1) {
        for(var k=1;k<this.channels.length-1;k++){
          var ch=this.channels[k];
          inpartition_slots.push({slot_offset:slot, channel_offset:ch});
        }
      }
    }
    return inpartition_slots;
  }
  
  // calculate the needed size(slot range) to assign non-optimal cells
  this.calc_needed_slots=function(row,type,layer) {
    var slots_list = this.inpartition_slots(2,{type:type,layer:layer},row)
    // make a copy
    var sch_cp = JSON.parse(JSON.stringify(this.schedule));
    var used_subslot = JSON.parse(JSON.stringify(this.used_subslot));

    this.assign_slot_sim = function(cell) {
      var ret = {}
      for(var i=0;i<slots_list.length;++i){
        var slot=slots_list[i];
        var candidate = 0
        if(sch_cp[slot.slot_offset][slot.channel_offset][0]!=null) {
          // not this partition
          if(sch_cp[slot.slot_offset][slot.channel_offset][0].type!=type&&sch_cp[slot.slot_offset][slot.channel_offset][0].layer!=layer) {
            candidate = slot
          }
        } else {
          var nodes_list = [cell.sender,cell.receiver]
          // slot is empty
          candidate = slot
        }
        // not find
        if(!candidate) continue

        // check order
        var parent = 0
        if(cell.type=="uplink") parent = cell.receiver
        else parent = cell.sender
        var parent_slot = this.find_slot_index(parent, cell.type, cell.layer-1)
        if(cell.sendertype=="uplink") {
          if(slot.slot_offset>parent_slot) continue
        } else {
          if(slot.slot_offset<parent_slot && Math.abs(slot.slot_offset-parent_slot)<60) continue
        }

        // check if this slot (any channel) is assigned to the members
        var pass=0
        for(var c in this.channels) {
          var ch=this.channels[c];
          if(sch_cp[candidate.slot_offset][ch][0]!=null) {
            if(nodes_list.indexOf(sch_cp[candidate.slot_offset][ch][0].sender)==-1 && nodes_list.indexOf(sch_cp[candidate.slot_offset][ch][0].receiver)==-1) {
              pass++
            }
          } else pass++
        }
        if(pass==this.channels.length) {
          sch_cp[candidate.slot_offset][candidate.channel_offset][0] = {
            type:cell.type,
            layer: cell.layer,
            row: cell.row,
            sender:cell.sender,
            receiver:cell.receiver,
            is_optimal: 1,
          }
          ret = {slot:[candidate.slot_offset, candidate.channel_offset],cell:cell,is_optimal:1}
          break
        }
      }
      return ret
    }

    for(var j=0;j<this.used_subslot.length;j++) {
      if(!this.used_subslot[j].is_optimal && this.used_subslot[j].cell.type==type && this.used_subslot[j].cell.row==row &&
          this.used_subslot[j].cell.layer==layer) {
        var ret = this.assign_slot_sim(this.used_subslot[j].cell)
        if(ret!=null)
          used_subslot.push(ret)
      }
    }

    var diff = 0
    // [start, end)
    var original_size = [this.partition[row][type][layer].start,this.partition[row][type][layer].end]
    var max = original_size[0]
    var min = original_size[1]
    for(var k=0;k<used_subslot.length;k++) {
      if(used_subslot[k].is_optimal&&used_subslot[k].cell.type==type&&used_subslot[k].cell.row==row&&used_subslot[k].cell.layer==layer) {
        if(min>=used_subslot[k].slot[0]) min=used_subslot[k].slot[0]
        if(max<=used_subslot[k].slot[0]) max=used_subslot[k].slot[0]
      }
    }
    if(row==0) {
      diff = original_size[0]-min
    } else {
      diff = max+1-original_size[1]
    }
    return diff
  }

  // adjust the partition (and its slots) offset and its neighbour's size
  // offset >0 right, <0 left
  this.adjust_partition_offset=function(row,type,layer,offset) {
    // broadcast partition do not need adjust, for now
    if(type=="broadcast"||offset==0) return
    
    // adjust cells offset
    // adjust cells in this.schedule
    var channels = []
    // if(row==0) channels = this.channels.slice(0,this.channels.length/2)
    // if(row==1) channels = this.channels.slice(this.channels.length/2,this.channels.length)
    channels = this.channels
    
    for(var c in channels) {
      var ch = channels[c]
      // offset>0, rear to front
      if(offset>0) {
        for(var slot=this.partition[row][type][layer].end;slot>=this.partition[row][type][layer].start;slot--) {
          for(var sub=0;sub<SUBSLOTS;++sub) {
            if(this.schedule[slot][ch][sub]!=null) {
              this.schedule[slot+offset][ch][sub] = this.schedule[slot][ch][sub]
              this.schedule[slot][ch][sub] = null
            }
          }
        }
      } else {
        // offset<0, front to rear
        for(var slot=this.partition[row][type][layer].start;slot<this.partition[row][type][layer].end;slot++) {
          for(var sub=0;sub<SUBSLOTS;++sub) {
            if(this.schedule[slot][ch][sub]!=null) {
              this.schedule[slot+offset][ch][sub] = this.schedule[slot][ch][sub]
              this.schedule[slot][ch][sub] = null
            }
          }
        }
      }
    }

    var count = 0
    // adjust cells in this.used_subslot  
    for(var i=0;i<this.used_subslot.length;i++) {
      if(this.used_subslot[i].cell.type==type && 
          this.used_subslot[i].cell.layer==layer && this.used_subslot[i].is_optimal) {
        this.used_subslot[i].slot[0]+=offset
        count++
      }
    }
    
    // adjust partition offset
    if(type=="uplink") {
      this.partition[row][type][layer-1].start += offset
      this.partition[row][type][layer].end += offset
    } else  {
      this.partition[row][type][layer].end +=offset
      this.partition[row][type][layer].start +=offset
      
      // if(layer==this.partition.downlink.length-1) 
        // this.adjust_partition_offset(0,'downlink',0,offset)
      
    }
    return count
  }

  // adjust the partition and its neighbour's size
  // side: 'left' or 'right'
  // offset >0 expand, <0 shrink
  // U0 shall not adjust right side, D0 shall not adjust left side
  this.adjust_partition_size=function(row,type,layer,side,offset) {
    // broadcast partition do not need adjust, for now
    if(type=="broadcast") return
    if(side=="left") {
      this.partition[row][type][layer].start -= offset
    }
    if(side=="right") {
      this.partition[row][type][layer].end += offset
    }
    if(layer==1) {
      if(type=="uplink"&&side=="right") this.partition[row]['uplink'][0].start = this.partition[row]['uplink'][1].end
      if(type=="downlink"&&side=="left") {
        
        this.partition[row]['downlink'][0].end = this.partition[row]['downlink'][1].start
      }
    }
  }

  this.get_gap=function(row,type, layer) {
    // if(layer==1) return 10
    // if(layer==2) return 7
    // if(layer==3) return 3 
    // if(layer==4) return 3
    return 1
  }
  
  this.reset_partition_changes = function() {
    // reset partition_changes
    // for(var p in this.partition_changes) {
    //   this.partition_changes[p].count = 0
    // }
  }

  this.adjustment_summary = {'0':{},'1':{}}

  // adjust partition boundary
  this.adjust=function(row, type, layer) {
    if(layer==0) return
    sides = ['right','left']
    var side = (type=="uplink")?0:1
    var sign = (type=="uplink")?1:-1
    // console.log("[*] adjusting row",row,type,layer,'...')
    var gap = this.get_gap(row,type,layer)
    var needed_size = this.calc_needed_slots(row,type,layer) + gap // leave some space
    // console.log("    needs", needed_size, "slots")
    // expand, low layers first
    if(needed_size>0) {
      for(var l=1;l<layer+(1-side);l++) {
        var count = this.adjust_partition_offset(row,type,l,needed_size*sign)
        var name = type[0]+l
        if(this.adjustment_summary[row][name]==null) this.adjustment_summary[row][name] = {affected_cells: count, offset:0}
        this.adjustment_summary[row][name].offset += needed_size*sign
      }
    // shrink, high layers first
    } else {
      for(var l=layer-side;l>0;l--) {
        var count = this.adjust_partition_offset(row,type,l,needed_size*sign)
        var name = type[0]+l
        if(this.adjustment_summary[row][name]==null) this.adjustment_summary[row][name] = {affected_cells: count, offset:0}
        this.adjustment_summary[row][name].offset += needed_size*sign
      }
    }
    // console.log("    neighbours move to the",sides[side],"by", needed_size)
    if(type=="downlink") this.adjust_partition_size(row,type, layer, sides[side], needed_size)
    
    // console.log("   ",type,layer , "expands to the", sides[side], "by", needed_size)

    this.adjust(row,type, layer-1)
  }

  this.dynamic_partition_adjustment=function() {
    // highest layer of non-optmial cells
    var highest_layer = Object.keys(this.partition[0]['uplink']).length-1
    for(var row=0;row<1;row++) {
      this.adjust(row,'uplink',highest_layer); this.adjust(row,'downlink',highest_layer)
    }
    // this.reset_partition_changes()

    console.log('Partitions offset adjustment summary:',this.adjustment_summary)
    
    this.partition = align_rows(this.partition,OFFSET)
    
    // make a real/deep copy! add or remove will change sch.used_subslot length
    var used_subslot = JSON.parse(JSON.stringify(this.used_subslot));
    var cnt = 0
    // put unaligned links back
    for(var j=0;j<used_subslot.length;j++) {
      if(!used_subslot[j].is_optimal) {
        var old = used_subslot[j]
        this.remove_subslot({slot_offset:old.slot[0],channel_offset:old.slot[1]}, {offset:old.subslot[0], period:old.subslot[1]})
        
        // console.log("adjusting",old)
        var ret = this.find_empty_subslot([old.cell.sender, old.cell.receiver],1,{type:old.cell.type,layer:old.cell.layer},old.cell.row)
        // console.log("to new position",ret)
        this.add_subslot(ret.slot, ret.subslot, {row:old.cell.row,type:old.cell.type,layer:old.cell.layer,sender:old.cell.sender,receiver:old.cell.receiver}, ret.is_optimal);
        
        cnt++
      }
    }
    // console.log("Put", cnt, "non-optimal cells back")
  }

  //3-d searcher
  this.find_empty_subslot=function(nodes_list, period, info, row){
    var slots_list;

    //This part is the partitioned scheduler
    if((algorithm == PART || algorithm == PARTPLUS ) && info!=null){
      
      if(info.type!="beacon") {
        // Try the part more than 2 slots away from the start of the row 0 of this partition
        const GAP = 2
        slots_list=this.inpartition_slots(0,info,1);
        for(var i=0;i<slots_list.length;++i){
          var slot=slots_list[i];
          if((this.partition[1][info.type][info.layer].end-slot.slot_offset)>GAP) {
            for(var offset=0;offset<period;++offset){
              if(this.available_subslot(nodes_list,slot,{period:period,offset:offset},info,1)){
                ret = {slot:slot,subslot:{offset:offset,period:period},is_optimal:1}
                return(ret);
                // console.log("Empty subslot found:",ret)
              }
            }
          }
        }
        // console.log("No empty slot in this row, try the other row",nodes_list,info)
        // Try the part more than 2 slots away from the end of the row 1 of this partition
        slots_list=this.inpartition_slots(0,info,0);
        for(var i=0;i<slots_list.length;++i){
          var slot=slots_list[i];
          if((slot.slot_offset-this.partition[0][info.type][info.layer].start)>GAP) {
            for(var offset=0;offset<period;++offset){
              if(this.available_subslot(nodes_list,slot,{period:period,offset:offset},info,1)){
                ret = {slot:slot,subslot:{offset:offset,period:period},is_optimal:1}
                // console.log("Empty subslot found:",ret)
                return(ret);
              }
            }
          }
        }
      }
      
      // try rest part
      slots_list=this.inpartition_slots(0,info,row);
      for(var i=0;i<slots_list.length;++i){
        var slot=slots_list[i];
        for(var offset=0;offset<period;++offset){
          if(this.available_subslot(nodes_list,slot,{period:period,offset:offset},info,1)){
            ret = {slot:slot,subslot:{offset:offset,period:period},is_optimal:1}
            return(ret);
            // console.log("Empty subslot found:",ret)
          }
        }
      }
      
      // console.log("No empty slot in this row, try the other row",nodes_list,info)
      slots_list=this.inpartition_slots(0,info,1-row);
      for(var i=0;i<slots_list.length;++i){
        var slot=slots_list[i];
        for(var offset=0;offset<period;++offset){
          if(this.available_subslot(nodes_list,slot,{period:period,offset:offset},info,1)){
            ret = {slot:slot,subslot:{offset:offset,period:period},is_optimal:1}
            // console.log("Empty subslot found:",ret)
            return(ret);
          }
        }
      }

      // console.log("No empty aligned slot")
      this.nonOptimalCount++;
    }

    // assign in reserved area, row 0
    slots_list = this.inpartition_slots(1, {type:info.type, layer: 0},0);
    for(var i=0;i<slots_list.length;++i){
      var slot=slots_list[i];
      for(var offset=0;offset<period;++offset){
        if(this.available_subslot(nodes_list,slot,{period:period,offset:offset},info,0)){
          var ret = {slot:slot,subslot:{offset:offset,period:period}, is_optimal:0}
          // console.log("find an alternative slot:",ret);
          return(ret);
        }
      }
    }
    
    console.log("No emplty slot found");
    this.isFull=true;
    return  {slot:{slot_offset:0,channel_offset:1},subslot:{offset:0,period:1}, is_optimal:0};
  }

  // get idle slots number of one partition
  this.get_idle_slots=function(layer) {
    for(var i=this.partition[0]['uplink'][layer].end-1;i>this.partition[0]['uplink'][layer].start;i--) {
      for(var c=0;c<this.channels.length/2;c++) {
        // find the edge
        var ch = this.channels[c]
        if(this.schedule[i][ch][0]!=null) {
          return this.partition[0]['uplink'][layer].end - 1 - i 
        }
      }
    }
  }

  // get idle slots number of all partition
  this.get_idles_all=function() {
    var list = []
    for(var l=1;l<Object.keys(this.partition[0]['uplink']).length;l++) {
      list[l] = this.get_idle_slots(l)
    }
    return list
  }

  this.remove_node=function(node){
    for(var slot=0;slot<this.slotFrameLength;++slot){
      for(var c in this.channels){
        var ch=this.channels[c];
        for(var sub=0;sub<SUBSLOTS;++sub){
          if(this.schedule[slot][ch][sub]!=null){
            if( 
              this.schedule[slot][ch][sub].sender==node ||
              this.schedule[slot][ch][sub].receiver==node
            ){
              // console.log("schedule["+slot+"]["+ch+"]["+sub+"] cleaned");
              this.schedule[slot][ch][sub]=null;
            }
          }
        }
      }
    }
    for(var i=0;i<this.used_subslot.length;i++) {
      if(this.used_subslot[i].cell.sender==node||this.used_subslot[i].cell.receiver==node) {
        this.used_subslot.splice(i,1)
        // array length will change
        i--
      }
    }
  }

  this.periodOffsetToSubslot = function(periodOffset, period)
  {
     return periodOffset*((SUBSLOTS/period) % SUBSLOTS);
  }
}

module.exports={
  create_scheduler:create_scheduler,
  SUBSLOTS : SUBSLOTS
};
