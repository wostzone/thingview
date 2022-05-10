<script lang="ts" setup>

import { h, ref } from 'vue';
import { DateTime } from 'luxon';
import {timeAgo} from '@/data/timeAgo'
import { TDPropertyAffordance, ThingTD } from '@/data/thing/ThingTD';
import TSimpleTable, { ISimpleTableColumn } from '@/components/TSimpleTable.vue';
import { ConsumedThing } from '@/data/thing/ConsumedThing';
import InteractionOutput from '@/data/thing/InteractionOutput';
// import {thingStore} from '@/data/thing/ThingStore'

const props = defineProps<{
  /**
   * The consumed thing whose properties to show
   */
  cThing: ConsumedThing

  /**
   * Names of properties to show or undefined to show all properties in the cThing
   */
  propNames?: string[]

  /**
   * Enable selecting a property. This shows a pointer cursor on the property name
   */
  enablePropSelect?: boolean

  /** Text to show when table has nothing else to show */
  noDataLabel?: string
}>()

/**
 * Optional event when enabled
 * @args: [TD, propertyName, propertyAffordance]
 */
const emits = defineEmits(["onThingPropertySelect"])


/** Aggregate info for displaying a property */
interface IProperyDisplayInfo {
   /** name of property to show */
   name: string
   /** The property affordance, eg schema of the property */
   pa: TDPropertyAffordance
   /** latest property value */
   io: InteractionOutput 
}

// the current time will be updated every 30 seconds to refresh the display
const currentTime = ref(DateTime.now())
setInterval(()=>{
  currentTime.value = DateTime.now()
}, 30000)


/**
 * Select property 
 */
const handleThingPropertySelect = (propInfo:IProperyDisplayInfo)=>{
  console.log("ThingPropertiesTable.handleThingPropertySelect, \
      thingID=%s, propID=%s, thingProperty", props.cThing.id, propInfo.name)
  
  emits("onThingPropertySelect", props.cThing.td, propInfo.name, propInfo.pa)
}

/** return a list of properties to show, containing:
 * {
 *    name: string
 *    pa: TDPropertyAffordance
 *    io: InteractionOutput with property value
 * }
 * @param cThing consumed thing whose properties to show
 * @param propNames with names of properties to show, or undefined to show all
 */
const propertiesToShow = (cThing:ConsumedThing, propNames?:string[]): Array<IProperyDisplayInfo> => {
  // let names = new Array<string>() 
  if (!propNames) {
    propNames = new Array<string>()
    Object.entries(cThing.td.properties).forEach(([name]) => {
      propNames?.push(name)
    })
  }
  let propList = propNames.map((name:string)=>{
    let pa = cThing.td.properties[name]
    let io = cThing.properties.get(name)
    if (!io ) {
      // fake it until it makes it ...
      io = new InteractionOutput("", DateTime.fromSeconds(0))
    }
    return {
      pa: pa,
      name:name,
      io:io
    }
  })
  return propList
}

/**
 * Table columns from the tile item rows: [{name:string, pa:TDPropertyAffordance, io:InteractionOutput}]
 */
const propertyItemColumns:ISimpleTableColumn[] = [
  {
    title: "Name", 
    field: "pa.title",
    // maxWidth: "0",
    // width: "50%",
    component: (row:any) => h('span', 
      { 
        style: (props.enablePropSelect ? 'cursor:pointer':''), 
        onClick: ()=>handleThingPropertySelect(row),
      }, 
      {default: ()=>row.pa.title}
    ),
  },
  {
    title: "Value", 
    // maxWidth: "0",
    // width: "50%",
    field: "io.value",
    component: (row:any)=>h('span', {}, 
        { default: ()=>row.io.value }
      )
  },
  // {title: "Type", field:"pa.type", align:"left",
  //   // maxWidth: "0",
  //   width: "80px", sortable:true
  // },
  // {title: "Default", field:"pa.default", align:"left",
  //   width: "70px",
  //   // maxWidth: "70px",
  // },
  {title:"Updated", field:"io.updated",
    component: (row:any)=>h('span', {}, 
        { default: ()=>timeAgo(DateTime.fromISO(row.io.updated), currentTime.value)
        })
  }
]

</script>


<template>

 <TSimpleTable 
  dense
  :columns="propertyItemColumns"
  :rows="propertiesToShow(props.cThing, props.propNames)"
  :noDataLabel="props.noDataLabel"
/>

</template>