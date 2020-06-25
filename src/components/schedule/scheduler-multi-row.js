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
const ROWS=3;
const partition_config = require("./partition.json");
const { seq } = require("async");


function partition_init(sf){
  //Beacon reserved version
  var u_d = [Math.floor(sf-partition_config.beacon)/2, Math.floor(sf-partition_config.beacon)/2];
  // var u_d = [sf-partition_config.beacon,sf-partition_config.beacon]
  // partition_scale(u_d, sf-RESERVED-partition_config.beacon);
  var uplink = partition_config.uplink.slice();
  
  var uplink_row0 = partition_scale(uplink, u_d[0]);
  var uplink_row1 = partition_scale(uplink, u_d[0]-uplink_row0[0]);
  var uplink_row2 = partition_scale(uplink, u_d[0]-uplink_row0[0]-uplink_row1[0]);
  
  var downlink = partition_config.downlink.slice();
  var downlink_row0 = partition_scale(downlink, u_d[1]);
  var downlink_row1 = partition_scale(downlink, u_d[1]-downlink_row0[0]);
  var downlink_row2 = partition_scale(downlink, u_d[1]-downlink_row0[0]-downlink_row1[0]);

  //now we have everything scaled by slotframe length
  //and start do the partition
  var cur_r0 = RESERVED;
  var cur_r1 = RESERVED;
  var cur_r2 = RESERVED;

  var partition={
    broadcast:{},
  }
  for(var r=0;r<ROWS;r++) {
    partition[r] = {uplink:{}, downlink:{}}
  }

  // Reserved beacon
  partition.broadcast={start:cur_r0, end:cur_r0+partition_config.beacon};
  cur_r0+=partition_config.beacon;
  cur_r1 = cur_r0
  cur_r2 = cur_r0

  // uplink
  for(var u=uplink.length-1; u>=0; --u){
    partition[0].uplink[u]={start:cur_r0, end:cur_r0+uplink_row0[u]};
    partition[1].uplink[u]={start:cur_r1, end:cur_r1+uplink_row1[u]};
    partition[2].uplink[u]={start:cur_r2, end:cur_r2+uplink_row2[u]};
    
    cur_r0+=uplink_row0[u];
    cur_r1+=uplink_row1[u];
    cur_r2+=uplink_row2[u];
  }
  
  // downlink
  cur_r0 = 127
  cur_r1 = 127
  cur_r2 = 127

  for(var d=downlink.length-1; d>=0; --d){
    partition[0].downlink[d]={start:cur_r0-downlink_row0[d], end:cur_r0};
    partition[1].downlink[d]={start:cur_r1-downlink_row1[d], end:cur_r1};
    partition[2].downlink[d]={start:cur_r2-downlink_row2[d], end:cur_r2};
    
    cur_r0-=downlink_row0[d];
    cur_r1-=downlink_row1[d];
    cur_r2-=downlink_row2[d];
  }


  window.console.log("patition:", partition);
  return partition;
}

function partition_scale(raw_list, size){
  var list = JSON.parse(JSON.stringify(raw_list));
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

function create_scheduler(sf,ch){
/*
Slot = {slot_offset, channel}
Subslot = {period, offset}
Cell = {type, layer, row, sender, receiver}

used_subslot = {slot: [slot_offset, ch_offset], subslot: [periord, offset], cell: cell, is_optimal:1}
*/
  if(!(this instanceof create_scheduler)){
    return new create_scheduler(sf,ch);
  }
  
  window.console.log("create_scheduler("+sf+","+ch+")");
  this.slotFrameLength=sf;
  this.channels=ch;
  this.schedule = new Array(sf);
  // { parent: [children] }, mainly for count subtree size
  this.topology = {0:[]}
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
  this.channelRows = {0:[1,2,3,4,5,6,7,8], 1:[9,10,11,12], 2:[13,14,15,16]}

  this.setTopology=function(topo) {
    this.topo = topo
  }

  this.add_slot=function(slot,cell){
    this.add_subslot(slot, {offset:0, period:1}, cell);
  }

  this.add_subslot=function(slot,subslot,cell, is_optimal){
    var sub_start = subslot.offset * SUBSLOTS/subslot.period;
    var sub_end = (subslot.offset+1) * SUBSLOTS/subslot.period;

    for(var sub = sub_start; sub < sub_end; ++sub){
      this.schedule[slot.slot_offset][slot.channel_offset][sub]={
        type: cell.type,
        layer: cell.layer,
        sender:cell.sender,
        receiver:cell.receiver,
      }
    }

    this.used_subslot.push({slot:[slot.slot_offset, slot.channel_offset],subslot:[subslot.offset,subslot.period],cell:cell,is_optimal: is_optimal})

    if(cell.type=="uplink") {
      if(this.topology[cell.receiver]!=null) {
        if(this.topology[cell.receiver].indexOf(cell.sender)==-1) {
          this.topology[cell.receiver].push(cell.sender)
        }
      }
      else this.topology[cell.receiver] = [cell.sender]
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
        this.used_subslot.splice(i,1)
        i--
      }
    }
  }

  // remove used subslot by sender, receiver, type
  this.remove_usedsubslot=function(sender, receiver, type) {
    for(var i=0;i<this.used_subslot.length;i++) {
      if(this.used_subslot[i].cell.sender == sender &&
          this.used_subslot[i].cell.receiver == receiver &&
          this.used_subslot[i].cell.type == type) {
        this.used_subslot.splice(i,1)
        i--
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

        var parent_slot = this.find_cell(parent, info.type)
        if(info.type=="uplink") {
          if(slot.slot_offset>parent_slot.slot[0]) return false
        } else {
          if(slot.slot_offset<parent_slot.slot[0]) return false
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
          for(var c in this.channelRows[row]) {
            var ch = this.channelRows[row][c]
            inpartition_slots.push({slot_offset:slot, channel_offset:ch});
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
        var parent_slot = this.find_cell(parent, cell.type, cell.layer-1)
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
    
    for(var c in this.channelRows[row]) {
      var ch = this.channelRows[row][c]
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
      if(this.used_subslot[i].cell.type==type && this.used_subslot[i].cell.row==row &&
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
    return 2
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

  // find the first(uplink)/last(downlink) used slot of the node
  this.find_cell=function(node,type) {
    for(var i=0;i<this.used_subslot.length;i++) {
      if(type == "uplink") {
        if(this.used_subslot[i].cell.sender==node && this.used_subslot[i].cell.type == type) {
          return this.used_subslot[i]
        }
      } else if(type == "downlink") {
        if(this.used_subslot[i].cell.receiver==node && this.used_subslot[i].cell.type == type) {
          return this.used_subslot[i]
        }
      }
    }
  }

  // get subtree size (get children and children's children number)
  this.get_subtree_size=function(node) {
    if(this.topology[node]==null) return 0
    var cnt = this.topology[node].length
    for(var i=0;i<this.topology[node].length;i++) {
      cnt += this.get_subtree_size(this.topology[node][i])
    }
    return cnt
  }

  // check if this partition uses the minimum slots (used_slots > the max number of children with same parent)
  // return used - Common Parent nodes
  this.get_extra_slots=function(row, type, layer) {
    var start = this.partition[row][type][layer].start
    var find = false
    for(var i=this.partition[row][type][layer].start;i<this.partition[row][type][layer].end;i++) {
      if(!find) {
        for(var c in this.channelRows[row]) {
          // find the edge
          var ch = this.channelRows[row][c]
          start = i
          if(this.schedule[i][ch][0]!=null) {
            find = true
            break
          }
        }
      }
    }
    
    var used_slots = find ? this.partition[row][type][layer].end-start : 0
    
    var parents = {}
    for(var j=0;j<this.used_subslot.length;j++) {
      if(this.used_subslot[j].cell.row==row&&this.used_subslot[j].cell.type==type&&this.used_subslot[j].cell.layer==layer) {
        var parent = (type=="uplink")?this.used_subslot[j].cell.receiver:this.used_subslot[j].cell.sender
        if(parents[parent]==null) parents[parent] = 1
        else parents[parent]++
      }
    }
    var max_common_parent_nodes = 0
    if(Object.keys(parents).length>0) max_common_parent_nodes = parents[Object.keys(parents).sort(function(a,b){return parents[b]-parents[a]})[0]]
    
    return used_slots - max_common_parent_nodes
    
  }
  // get conflict slots, same sender/receiver in one slot
  // call it after adjust partition offset
  this.get_conflict_slots=function() {
    var ret = {}
    for(var i=this.partition.broadcast.end;i<69;i++) {
      var tmp = {}
      var ch = []
      for(var j=1;j<17;j++) {
        if(this.schedule[i][j][0]!=null) {
          if(tmp[this.schedule[i][j][0].sender]==null) {
            tmp[this.schedule[i][j][0].sender] = j
          } else {
            ch.push(tmp[this.schedule[i][j][0].sender],j)
          }
          if(tmp[this.schedule[i][j][0].receiver]==null) {
            tmp[this.schedule[i][j][0].receiver] = j
          } else {
            ch.push(tmp[this.schedule[i][j][0].receiver],j)
          }
        }
      }
      if(ch.length>0) ret[i] = Array.from(new Set(ch))
    }
    return ret
  }


  // get idle slots number of one partition
  this.get_idle_slots=function(row,type,layer) {
    for(var i=this.partition[row][type][layer].start;i<this.partition[row][type][layer].end;i++) {
      for(var c in this.channelRows[row]) {
        // find the edge
        var ch = this.channelRows[row][c]
        if(this.schedule[i][ch][0]!=null) {
          return i-this.partition[row][type][layer].start
        }
      }
    }
    return this.partition[row][type][layer].end - this.partition[row][type][layer].start
  }

  // get idle slots number of all partition
  this.get_idles_all=function() {
    var list = []
    for(var l=1;l<Object.keys(this.partition[0]['uplink']).length;l++) {
      list[l] = this.get_idle_slots(l)
    }
    return list
  }

  // swap two cells' position (slot, ch)
  // input should be one element of this.used_subslot, use this.find_cell to get
  // need 3 edits
  this.swap_cells=function(cell1, cell2) {
    var tmp = cell1.cell.row 
    cell1.cell.row = cell2.cell.row
    cell2.cell.row = tmp

    this.add_subslot({slot_offset:10, channel_offset:10},{offset:0,period:1},cell1.cell,cell1.is_optimal)
    this.remove_slot({slot_offset:cell1.slot[0],channel_offset:cell1.slot[1]})

    this.add_subslot({slot_offset:cell1.slot[0],channel_offset:cell1.slot[1]},{offset:0,period:1},cell2.cell,cell2.is_optimal)
    this.remove_slot({slot_offset:cell2.slot[0],channel_offset:cell2.slot[1]})
    
    this.add_subslot({slot_offset:cell2.slot[0],channel_offset:cell2.slot[1]},{offset:0,period:1},cell1.cell,cell1.is_optimal)
    this.remove_slot({slot_offset:10,channel_offset:10})
  }

  // adjust cells of one partition (all rows)
  // 1. change order by subtree size; 2. 
  this.inpartition_adjust=function(type, layer) {
    
  }

  this.get_subtree_size_list=function(type, layer) {
    var subtree_sizes = []
    for(var i=0;i<this.used_subslot.length;i++) {
      if(this.used_subslot[i].cell.layer==layer && this.used_subslot[i].cell.type==type) {
        subtree_sizes.push({
          sender:this.used_subslot[i].cell.sender,
          slot:this.used_subslot[i].slot[0],
          ch:this.used_subslot[i].slot[1],
          size:this.get_subtree_size(this.used_subslot[i].cell.sender),
        })
      }
    }
    return subtree_sizes.sort((a, b) => (a.slot > b.slot) ? 1 : -1)
  }

  // adjust the order of cells of one partition by subtree size
  // version 1: cycle sort
  this.adjust_subtree_distribution=function(type, layer) {
    var subtree_sizes = this.get_subtree_size_list(type, layer)

    // cycle sort, minimize swap opertations
    var cnt = 0
    var swapped = []
    for(var cycleStart=0;cycleStart<subtree_sizes.length;cycleStart++) {
      var item = JSON.parse(JSON.stringify(subtree_sizes[cycleStart]))
      var pos = cycleStart

      // find the right index
      for(var i=cycleStart+1;i<subtree_sizes.length;i++) 
        if(subtree_sizes[i].size < item.size) 
          pos++

      // not changed
      if(pos==cycleStart) continue
      
      // skip duplicates
      while(item.size == subtree_sizes[pos].size) pos++

      // write
      var tmp = JSON.parse(JSON.stringify(subtree_sizes[pos])) 
      subtree_sizes[pos] = item
      subtree_sizes[pos].slot = tmp.slot
      item = tmp
      
      // repeat above to find a value to swap
      while(pos!=cycleStart) {
        pos = cycleStart
        
        for(var i=cycleStart+1;i<subtree_sizes.length;i++)
          if(subtree_sizes[i].size < item.size)
            pos++

        while(item.size == subtree_sizes[pos].size) pos++

        tmp = JSON.parse(JSON.stringify(subtree_sizes[pos]))
        var itemCell = this.find_cell(item.sender,"uplink")
        var tmpCell = this.find_cell(tmp.sender,"uplink")
        this.swap_cells(itemCell, tmpCell)
        // console.log("SWAP",item, tmp)
        swapped.push(item.sender, tmp.sender)
        cnt++

        subtree_sizes[pos] = item
        subtree_sizes[pos].slot = tmp.slot
        item = tmp
      }
    }
    // console.log(subtree_sizes)
    // console.log(Array.from(new Set(swapped)).length)
    return cnt
  }

  // adjust the order of cells of one partition by subtree size
  // Version 2, determine the order by size and then do a `rejoin` process to get the schedule
  this.adjust_subtree_distribution_v2=function(type, layer) {
    var schedule_backup = JSON.parse(JSON.stringify(this.schedule))
    var used_subslot_backup = JSON.parse(JSON.stringify(this.used_subslot))
    var subtree_sizes = this.get_subtree_size_list(type, layer)
    subtree_sizes.sort((a, b) => (a.size < b.size) ? 1 : -1)
    console.log(subtree_sizes)
    var sequence = []
    for(var i=0;i<subtree_sizes.length;i++) {
      // rejoin sequence
      var cell = this.find_cell(subtree_sizes[i].sender, "uplink")
      sequence.push(cell)

      // reset schedule
      this.schedule[subtree_sizes[i].slot][subtree_sizes[i].ch] = new Array(SUBSLOTS)
      
      sch.remove_usedsubslot(cell.cell.sender, cell.cell.receiver, cell.cell.type)
    }
    
    // reschedule
    for(var j=0;j<sequence.length;j++) {
      var cell = sequence[j]
      
      var ret = this.find_empty_subslot([cell.cell.sender, cell.cell.receiver], 1, {type:cell.cell.type, layer:cell.cell.layer})
      console.log(cell.cell.sender, ret.slot)
      sch.add_subslot(ret.slot, ret.subslot, {row:ret.row,type:"uplink",layer:cell.cell.layer,sender:cell.cell.sender,receiver:cell.cell.receiver}, ret.is_optimal);

    }
    
  }

  // adjust partitions to the left to leave space
  this.adjust_gap=function(node) {
    var cell = this.find_cell(node,"uplink")
    // idle slots number
    var have_idle_slots = []
    var total_idle_slots = 0
    for(var i=Object.keys(this.partition[0].uplink).length-1;i>cell.cell.layer;i--) {
      var idle_slots = this.get_idle_slots(2,"uplink",i)
      if(idle_slots>0) {
        have_idle_slots.push(i)
        total_idle_slots+=idle_slots
      }
    }
    // if(total_idle_slots)

  }

  this.dynamic_partition_adjustment=function() {
    // highest layer of non-optmial cells
    var highest_layer = Object.keys(this.partition[0]['uplink']).length-1
    for(var row=0;row<1;row++) {
      this.adjust(row,'uplink',highest_layer)
      // this.adjust(row,'downlink',highest_layer)
    }
    // this.reset_partition_changes()

    console.log('Partitions offset adjustment summary:',this.adjustment_summary)
    
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
  this.find_empty_subslot=function(nodes_list, period, info){
    var slots_list;
    var checkOrder = 1
    var parent = (info.type=="uplink") ? nodes_list[1]:parent = nodes_list[0]
    var rows = [0, 1, 2]

    // // move parent's row to the first
    // if(info.layer>0) {
    //   var parent_slot = this.find_cell(parent, info.type)   
    //   rows.splice(rows.indexOf(parent_slot.cell.row),1)
    //   rows.unshift(parent_slot.cell.row)
    // }

    for(var ii=0;ii<ROWS;ii++) {
      r = rows[ii]
      slots_list=this.inpartition_slots(0, info, r);
      for(var i=0;i<slots_list.length;++i){
        var slot=slots_list[i];
        for(var offset=0;offset<period;++offset){
          if(this.available_subslot(nodes_list,slot,{period:period,offset:offset}, info, checkOrder)){
            return {slot:slot,subslot:{offset:offset,period:period}, row:r, is_optimal:1}
          }
        }
      }
    }
    // console.log("No empty aligned slot")
    this.nonOptimalCount++;

    // assign in reserved area, row 0
    slots_list = this.inpartition_slots(1, {type:info.type, layer: 0},0);
    for(var i=0;i<slots_list.length;++i){
      var slot=slots_list[i];
      for(var offset=0;offset<period;++offset){
        if(this.available_subslot(nodes_list,slot,{period:period,offset:offset},info,0)){
          var ret = {slot:slot,subslot:{offset:offset,period:period},row:0, is_optimal:0}
          // console.log("find an alternative slot:",ret);
          return(ret);
        }
      }
    }
    
    console.log(nodes_list,info,"No emplty slot found");
    this.isFull=true;
    return  {slot:{slot_offset:0,channel_offset:1},row:0,subslot:{offset:0,period:16}, is_optimal:0};
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
