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


const RESERVED = 4; //Number of reserved
const SUBSLOTS = 8;
const ALGORITHM = "partition+"
const ROWS = 1
const partition_config = require("./partition.json");

function partition_init(sf) {
  //Beacon reserved version
  var u_d = [Math.floor(sf - partition_config.beacon - RESERVED) / 2, Math.floor(sf - partition_config.beacon - RESERVED) / 2];
  // var u_d = [sf-partition_config.beacon,sf-partition_config.beacon]
  // partition_scale(u_d, sf-RESERVED-partition_config.beacon);
  var uplink = partition_config.uplink.slice();

  var uplink_row0 = partition_scale(uplink, u_d[0]);
  

  var downlink = partition_config.downlink.slice();
  var downlink_row0 = partition_scale(downlink, u_d[1]);


  //now we have everything scaled by slotframe length
  //and start do the partition
  var cur_r0 = RESERVED;

  var partition = {
    broadcast: {},
  }
  for (var r = 0; r < 1; r++) {
    partition[r] = { uplink: {}, downlink: {} }
  }


  // uplink
  for (var u = uplink.length - 1; u >= 0; --u) {
    partition[0].uplink[u] = { start: cur_r0, end: cur_r0 + uplink_row0[u] };
    cur_r0 += uplink_row0[u];

  }

  // Reserved beacon
  partition.broadcast = { start: cur_r0, end: cur_r0 + partition_config.beacon };
  cur_r0 += partition_config.beacon;

  // downlink
  cur_r0 = sf


  for (var d = downlink.length - 1; d >= 0; --d) {
    partition[0].downlink[d] = { start: cur_r0 - downlink_row0[d], end: cur_r0 };

    cur_r0 -= downlink_row0[d];
  }


  // window.console.log("patition:", partition);
  return partition;
}

function partition_scale(raw_list, size) {
  var list = JSON.parse(JSON.stringify(raw_list));
  //scale the list to the size (sum(list)==size)
  var total = 0;
  for (var i = 0; i < list.length; ++i) {
    total += list[i];
  }
  for (var i = 0; i < list.length; ++i) {
    list[i] = list[i] * size / total;
  }
  //Now we need to arrange them to integers. We cannot directly floor or round or ceil
  //These will cause the sum!=size
  //we do the following 3 for's to round the boundary to closest integers
  for (var i = 1; i < list.length; ++i) {
    list[i] += list[i - 1];
  }
  for (var i = 0; i < list.length; ++i) {
    list[i] = Math.floor(list[i] + 0.5);
  }
  for (var i = list.length - 1; i > 0; --i) {
    list[i] -= list[i - 1];
  }

  return list;
}

function create_scheduler(sf, ch, algorithm) {
  /*
  Slot = {slot_offset, channel}
  Subslot = {period, offset}
  Cell = {type, layer, row, sender, receiver}
  
  used_subslot = {slot: [slot_offset, ch_offset], subslot: [periord, offset], cell: cell, is_optimal:1}
  */
  if (!(this instanceof create_scheduler)) {
    return new create_scheduler(sf, ch, algorithm);
  }

  // window.console.log("create_scheduler("+sf+","+ch+")", algorithm);
  this.slotFrameLength = sf;
  this.channels = ch;
  this.algorithm = algorithm
  this.schedule = new Array(sf);
  // { parent: [children] }, mainly for count subtree size
  this.topology = { 0: [] }
  // mainly for send cells to cloud
  this.used_subslot = []
  this.isFull = false;
  this.nonOptimalCount = 0;
  for (var i = 0; i < sf; ++i) {
    this.schedule[i] = new Array(16);
  }
  for (var c in this.channels) {
    var ch = this.channels[c];
    for (var slot = 0; slot < this.slotFrameLength; ++slot) {
      this.schedule[slot][ch] = new Array(SUBSLOTS)
    }
  }

  //initialize partition
  this.partition = partition_init(sf);
  // console.log(this.partition)
  this.channelRows = { 0: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] }

  this.setTopology = function (topo) {
    this.topo = topo
  }

  this.add_slot = function (slot, cell) {
    this.add_subslot(slot, { offset: 0, period: 1 }, cell);
  }

  this.add_subslot = function (slot, subslot, cell, is_optimal) {
    var sub_start = subslot.offset * SUBSLOTS / subslot.period;
    var sub_end = (subslot.offset + 1) * SUBSLOTS / subslot.period;

    for (var sub = sub_start; sub < sub_end; ++sub) {
      this.schedule[slot.slot_offset][slot.channel_offset][sub] = {
        type: cell.type,
        layer: cell.layer,
        sender: cell.sender,
        receiver: cell.receiver,
      }
    }

    this.used_subslot.push({ slot: [slot.slot_offset, slot.channel_offset], subslot: [subslot.offset, subslot.period], cell: cell, is_optimal: is_optimal })

    if (cell.type == "uplink") {
      if (this.topology[cell.receiver] != null) {
        if (this.topology[cell.receiver].indexOf(cell.sender) == -1) {
          this.topology[cell.receiver].push(cell.sender)
        }
      }
      else this.topology[cell.receiver] = [cell.sender]
    }

  }

  this.remove_slot = function (slot) {
    this.remove_subslot(slot, { offset: 0, period: 1 });
  }

  this.remove_subslot = function (slot, subslot) {
    var sub_start = subslot.offset * SUBSLOTS / subslot.period;
    var sub_end = (subslot.offset + 1) * SUBSLOTS / subslot.period;
    for (var sub = sub_start; sub < sub_end; ++sub) {
      this.schedule[slot.slot_offset][slot.channel_offset][sub] = null;
    }

    for (var i = 0; i < this.used_subslot.length; i++) {
      if (this.used_subslot[i].slot[0] == slot.slot_offset &&
        this.used_subslot[i].slot[1] == slot.channel_offset &&
        this.used_subslot[i].subslot[0] == subslot.offset &&
        this.used_subslot[i].subslot[1] == subslot.period) {
        this.used_subslot.splice(i, 1)
        i--
      }
    }
  }

  // remove used subslot by sender, receiver, type
  this.remove_usedsubslot = function (sender, receiver, type) {
    for (var i = 0; i < this.used_subslot.length; i++) {
      if (this.used_subslot[i].cell.sender == sender &&
        this.used_subslot[i].cell.receiver == receiver &&
        this.used_subslot[i].cell.type == type) {
        this.used_subslot.splice(i, 1)
        i--
      }
    }
  }

  //3-d filter
  //flag=1: check order
  this.available_subslot = function (nodes_list, slot, subslot, info, flag) {
    if (slot.slot_offset < RESERVED) return false;
    // this.partition.broadcast.start = 125
    // this.partition.broadcast.end = 127
    //if is beacon, we want it always the first channel in the list;
    //it actually doesn't matter since hardware-wise it's hardcoded to beacon channel
    //but to make it consistant in scheduler table...
    if (info.type == "beacon" && slot.channel_offset != this.channels[0]) return false;

    //Beacon reserved version: broadcast partition can only be utilized by beacon
    if (this.partition.broadcast != null) {
      var start = this.partition.broadcast.start;
      var end = this.partition.broadcast.end;
      if (info.type == "beacon") {
        if (slot.slot_offset < start || slot.slot_offset >= end) return false;
      } else {
        if (slot.slot_offset >= start && slot.slot_offset < end) return false;
      }
    }

    //check if this slot-channel is assigned
    var sub_start = subslot.offset * SUBSLOTS / subslot.period;
    var sub_end = (subslot.offset + 1) * SUBSLOTS / subslot.period;
    for (var sub = sub_start; sub < sub_end; ++sub) {
      if (this.schedule[slot.slot_offset][slot.channel_offset][sub] != null)
        return false;
    }

    //check if this slot (any channel) is assigned to beacon
    //or is assigned to the members
    for (var c in this.channels) {
      var ch = this.channels[c];
      for (var sub = sub_start; sub < sub_end; ++sub) {
        if (this.schedule[slot.slot_offset][ch][sub] == null)
          continue;
        // if(info.type=="beacon")//if allocating beacon, must be a dedicated slot, no freq reuse (potential conflict)
        //   return false;
        //KILBYIIOT-6, beacon is no longer monitored after association:  
        //Tao: this is added back, since it can cause potential conflict
        if (this.schedule[slot.slot_offset][ch][sub].type == "beacon") return false;
        if (nodes_list.indexOf(this.schedule[slot.slot_offset][ch][sub].sender) != -1) return false;
        if (nodes_list.indexOf(this.schedule[slot.slot_offset][ch][sub].receiver) != -1) return false;
      }
    }

    if (flag && info.layer > 0) {
      if (info.type != "beacon") {
        var parent = 0
        if (info.type == "uplink") parent = nodes_list[1]
        else parent = nodes_list[0]

        var parent_slot = this.find_cell(parent, info.type)
        if (info.type == "uplink") {
          if (slot.slot_offset > parent_slot.slot[0]) return false
        } else {
          if (slot.slot_offset < parent_slot.slot[0]) return false
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
  this.inpartition_slots = function (flag, info, row) {
    // console.log("Partition schedule locating: "+info.type+", layer="+info.layer)
    var inpartition_slots = [];//result slot list

    var start = 0;
    var end = 0;
    if (info.type == "beacon") {
      if (this.partition.broadcast != null) {
        start = this.partition.broadcast.start;
        end = this.partition.broadcast.end;
      }
    }
    if (info.type == "uplink") {
      if (this.partition[row].uplink != null && this.partition[row].uplink[info.layer.toString()] != null) {
        start = this.partition[row].uplink[info.layer.toString()].start;
        end = this.partition[row].uplink[info.layer.toString()].end;
      }
    }
    if (info.type == "downlink") {
      if (this.partition[row].downlink != null && this.partition[row].downlink[info.layer.toString()] != null) {
        start = this.partition[row].downlink[info.layer.toString()].start;
        end = this.partition[row].downlink[info.layer.toString()].end;
      }
    }

    // var m=Math.floor((start+end)/2);    
    // expand partition size
    if (flag == 2) {
      if (info.type == "uplink") end += 30
      else start -= 30
    }

    //sorted slot offset list, from edge
    //if first layer tricks, from center
    var partition_slot_list = [];
    for (var i = 0; i < end - start; ++i) {
      partition_slot_list.push(0);
    }

    // flag==0: if try to find optimal slots
    if (flag == 0 || flag == 2) {
      if (info.type == "uplink") {
        //uplink 0, as late as possible
        for (var i = 0; i < end - start; i++) {
          partition_slot_list[i] = end - 1 - i;
        }
      } else {
        // downlink 0, as early as possible
        for (var i = 0; i < end - start; ++i) {
          partition_slot_list[i] = start + i;
        }
      }


    } else if (flag == 1) {
      // flag==1: find available slots in reserved area (layer 0 other channels)
      // from edge to center
      if (info.type == "uplink") {
        //uplink 0, as late as possible
        for (var i = 0; i < end - start; i++) {
          partition_slot_list[i] = end - 1 - i;
        }
      } else {
        // downlink 0, as early as possible
        for (var i = 0; i < end - start; ++i) {
          partition_slot_list[i] = start + i;
        }
      }
    }

    //generate slot list
    for (var i = 0; i < end - start; ++i) {
      var slot = partition_slot_list[i];
      if (flag == 0 || flag == 2) {
        if (info.type == "beacon") {
          inpartition_slots.push({ slot_offset: slot, channel_offset: this.channels[0] });
        } else {
          for (var c in this.channelRows[row]) {
            var ch = this.channelRows[row][c]
            inpartition_slots.push({ slot_offset: slot, channel_offset: ch });
          }
        }
        // find available slots in reserved area (layer 0 other channels)
      } else if (flag == 1) {
        for (var k = 1; k < this.channels.length - 1; k++) {
          var ch = this.channels[k];
          inpartition_slots.push({ slot_offset: slot, channel_offset: ch });
        }
      }
    }
    return inpartition_slots;
  }

  // calculate the needed size(slot range) to assign non-optimal cells
  this.calc_needed_slots = function (row, type, layer) {
    var slots_list = this.inpartition_slots(2, { type: type, layer: layer }, row)
    // make a copy
    var sch_cp = JSON.parse(JSON.stringify(this.schedule));
    var used_subslot = JSON.parse(JSON.stringify(this.used_subslot));

    this.assign_slot_sim = function (cell) {
      var ret = {}
      for (var i = 0; i < slots_list.length; ++i) {
        var slot = slots_list[i];
        var candidate = 0
        if (sch_cp[slot.slot_offset][slot.channel_offset][0] != null) {
          // not this partition
          if (sch_cp[slot.slot_offset][slot.channel_offset][0].type != type && sch_cp[slot.slot_offset][slot.channel_offset][0].layer != layer) {
            candidate = slot
          }
        } else {
          var nodes_list = [cell.sender, cell.receiver]
          // slot is empty
          candidate = slot
        }
        // not find
        if (!candidate) continue

        // check order
        var parent = 0
        if (cell.type == "uplink") parent = cell.receiver
        else parent = cell.sender
        var parent_slot = this.find_cell(parent, cell.type, cell.layer - 1)
        if (cell.sendertype == "uplink") {
          if (slot.slot_offset > parent_slot) continue
        } else {
          if (slot.slot_offset < parent_slot && Math.abs(slot.slot_offset - parent_slot) < 60) continue
        }

        // check if this slot (any channel) is assigned to the members
        var pass = 0
        for (var c in this.channels) {
          var ch = this.channels[c];
          if (sch_cp[candidate.slot_offset][ch][0] != null) {
            if (nodes_list.indexOf(sch_cp[candidate.slot_offset][ch][0].sender) == -1 && nodes_list.indexOf(sch_cp[candidate.slot_offset][ch][0].receiver) == -1) {
              pass++
            }
          } else pass++
        }
        if (pass == this.channels.length) {
          sch_cp[candidate.slot_offset][candidate.channel_offset][0] = {
            type: cell.type,
            layer: cell.layer,
            row: cell.row,
            sender: cell.sender,
            receiver: cell.receiver,
            is_optimal: 1,
          }
          ret = { slot: [candidate.slot_offset, candidate.channel_offset], cell: cell, is_optimal: 1 }
          break
        }
      }
      return ret
    }

    for (var j = 0; j < this.used_subslot.length; j++) {
      if (!this.used_subslot[j].is_optimal && this.used_subslot[j].cell.type == type && this.used_subslot[j].cell.row == row &&
        this.used_subslot[j].cell.layer == layer) {
        var ret = this.assign_slot_sim(this.used_subslot[j].cell)
        if (ret != null)
          used_subslot.push(ret)
      }
    }

    var diff = 0
    // [start, end)
    var original_size = [this.partition[row][type][layer].start, this.partition[row][type][layer].end]
    var max = original_size[0]
    var min = original_size[1]
    for (var k = 0; k < used_subslot.length; k++) {
      if (used_subslot[k].is_optimal && used_subslot[k].cell.type == type && used_subslot[k].cell.row == row && used_subslot[k].cell.layer == layer) {
        if (min >= used_subslot[k].slot[0]) min = used_subslot[k].slot[0]
        if (max <= used_subslot[k].slot[0]) max = used_subslot[k].slot[0]
      }
    }
    if (row == 0) {
      diff = original_size[0] - min
    } else {
      diff = max + 1 - original_size[1]
    }
    return diff
  }


  // find the first(uplink)/last(downlink) used slot of the node
  this.find_cell = function (node, type) {
    for (var i = 0; i < this.used_subslot.length; i++) {
      if (type == "uplink") {
        if (this.used_subslot[i].cell.sender == node && this.used_subslot[i].cell.type == type) {
          return this.used_subslot[i]
        }
      } else if (type == "downlink") {
        if (this.used_subslot[i].cell.receiver == node && this.used_subslot[i].cell.type == type) {
          return this.used_subslot[i]
        }
      }
    }
    console.log("cannot find this cell", node, type)
  }

  //generate a shuffled slot list to iterate
  this.shuffle_slots = function () {
    var shuffled_slots = [];
    for (var slot = 0; slot < this.slotFrameLength; ++slot) {
      for (var c in this.channels) {
        var ch = this.channels[c];
        shuffled_slots.push({ slot_offset: slot, channel_offset: ch });
      }
    }
    for (var i = shuffled_slots.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = shuffled_slots[i];
      shuffled_slots[i] = shuffled_slots[j];
      shuffled_slots[j] = temp;
    }
    var schedule = this.schedule;
    //pass into sort(func)
    //sort the shuffled list by subslot occupation
    shuffled_slots.sort(function (a, b) {
      var ca = 0, cb = 0;
      var a_sublist = schedule[a.slot_offset][a.channel_offset];
      var b_sublist = schedule[b.slot_offset][b.channel_offset];
      for (var sub = 0; sub < SUBSLOTS; ++sub) {
        if (a_sublist[sub] == null) {
          ++ca;
        }
        if (b_sublist[sub] == null) {
          ++cb;
        }
      }
      return ca - cb;
    });
    return shuffled_slots;
  }

  this.count_used_slotss = function () {
    var cnt = 0;
    for (var slot = 0; slot < 127; slot++) {
      var flag = 0;
      for (var ch = 1; ch < 17; ch++) {
        if (this.schedule[slot][ch][0] != null) {
          flag = 1
          break
        }
      }
      if (flag == 1)
        cnt++
    }
    return cnt
  }

  this.count_used_slots = function (type, layer) {
    var slots = {}
    for (var i = 0; i < this.used_subslot.length; i++) {
      if (this.used_subslot[i].is_optimal && this.used_subslot[i].cell.type == type && this.used_subslot[i].cell.layer == layer) {
        var cell = this.used_subslot[i]
        if (slots[cell.slot[0]] == null) slots[cell.slot[0]] = [cell]
        else slots[cell.slot[0]].push(cell)
      }
    }
    return Object.keys(slots).length
  }

  //3-d searcher
  this.find_empty_subslot = function (nodes_list, period, info) {
    var slots_list;
    var checkOrder = 1
    var parent = (info.type == "uplink") ? nodes_list[1] : parent = nodes_list[0]
    var rows = [0, 1, 2]

    // random
    if (this.algorithm == "random") {
      if (info.type == "beacon") slots_list = this.inpartition_slots(0, info, 0)
      else slots_list = this.shuffle_slots()
      for (var i = 0; i < slots_list.length; ++i) {
        var slot = slots_list[i];
        for (var offset = 0; offset < period; ++offset) {
          if (this.available_subslot(nodes_list, slot, { period: period, offset: offset }, info, 0)) {
            return { slot: slot, subslot: { offset: offset, period: period }, row: 0, is_optimal: 1 }
          }
        }
      }
      return
    }
    // LLSF, minimize slot gaps
    if (this.algorithm == "LLSF") {
      if (info.type == "beacon") slots_list = this.inpartition_slots(0, info, 0)
      else slots_list = this.LLSF(parent, info.type)
      for (var i = 0; i < slots_list.length; ++i) {
        var slot = slots_list[i];
        for (var offset = 0; offset < period; ++offset) {
          if (this.available_subslot(nodes_list, slot, { period: period, offset: offset }, info, 0)) {
            return { slot: slot, subslot: { offset: offset, period: period }, row: 0, is_optimal: 1 }
          }
        }
      }
      return
    }

    if (this.algorithm == "LDSF") {
      slots_list = this.LDSF(nodes_list, info)
      for (var i = 0; i < slots_list.length; ++i) {
        var slot = slots_list[i];
        for (var offset = 0; offset < period; ++offset) {
          if (this.available_subslot(nodes_list, slot, { period: period, offset: offset }, info, 0)) {
            return { slot: slot, subslot: { offset: offset, period: period }, row: 0, is_optimal: 1 }
          }
        }
      }
      console.log(nodes_list, info, "not found")
      return
    }

    // partition
    for (var ii = 0; ii < ROWS; ii++) {
      r = rows[ii]
      slots_list = this.inpartition_slots(0, info, r);
      for (var i = 0; i < slots_list.length; ++i) {
        var slot = slots_list[i];
        for (var offset = 0; offset < period; ++offset) {
          if (this.available_subslot(nodes_list, slot, { period: period, offset: offset }, info, checkOrder)) {
            return { slot: slot, subslot: { offset: offset, period: period }, row: r, is_optimal: 1 }
          }
        }
      }
    }
    // console.log("No empty aligned slot")
    this.nonOptimalCount++;

    // assign in reserved area, row 0
    slots_list = this.inpartition_slots(1, { type: info.type, layer: 0 }, 0);
    for (var i = 0; i < slots_list.length; ++i) {
      var slot = slots_list[i];
      for (var offset = 0; offset < period; ++offset) {
        if (this.available_subslot(nodes_list, slot, { period: period, offset: offset }, info, 0)) {
          var ret = { slot: slot, subslot: { offset: offset, period: period }, row: 0, is_optimal: 0 }
          // console.log("find an alternative slot:",ret);
          return (ret);
        }
      }
    }

    console.log(nodes_list, info, "No empty slot found");
    slots_list=this.shuffle_slots()
    for(var i=0;i<slots_list.length;++i){
      var slot=slots_list[i];
      for(var offset=0;offset<period;++offset){
        if(this.available_subslot(nodes_list,slot,{period:period,offset:offset}, info, 0)){
          return {slot:slot,subslot:{offset:offset,period:period}, row:0, is_optimal:0}
        }
      }
    }
    this.isFull = true;
    return { slot: { slot_offset: 5, channel_offset: 10 }, row: 0, subslot: { offset: 0, period: 16 }, is_optimal: 0 };
  }

  this.remove_node = function (node) {
    for (var slot = 0; slot < this.slotFrameLength; ++slot) {
      for (var c in this.channels) {
        var ch = this.channels[c];
        for (var sub = 0; sub < SUBSLOTS; ++sub) {
          if (this.schedule[slot][ch][sub] != null) {
            if (
              this.schedule[slot][ch][sub].sender == node ||
              this.schedule[slot][ch][sub].receiver == node
            ) {
              // console.log("schedule["+slot+"]["+ch+"]["+sub+"] cleaned");
              this.schedule[slot][ch][sub] = null;
            }
          }
        }
      }
    }
    for (var i = 0; i < this.used_subslot.length; i++) {
      if (this.used_subslot[i].cell.sender == node || this.used_subslot[i].cell.receiver == node) {
        this.used_subslot.splice(i, 1)
        // array length will change
        i--
      }
    }
  }

  this.periodOffsetToSubslot = function (periodOffset, period) {
    return periodOffset * ((SUBSLOTS / period) % SUBSLOTS);
  }
}

module.exports = {
  create_scheduler: create_scheduler,
  SUBSLOTS: SUBSLOTS
};
