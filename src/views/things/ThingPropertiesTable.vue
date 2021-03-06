<script lang="ts" setup>

import { h } from 'vue';
import { DateTime } from 'luxon';
import { useQuasar, QBtn } from 'quasar';
import { matEdit } from '@quasar/extras/material-icons';

import { isoAge } from '@/data/timeAgo'
import { TDPropertyAffordance } from '@/data/thing/ThingTD';
import TSimpleTable, { ISimpleTableColumn } from '@/components/TSimpleTable.vue';
import { ConsumedThing } from '@/data/thing/ConsumedThing';
import {InteractionOutput} from '@/data/thing/InteractionOutput';
import EditConfigDialog from './EditConfigDialog.vue';
import TAge from '@/components/TAge.vue';

const $q = useQuasar()

const props = defineProps<{
  /**
   * The consumed thing whose properties to show
   */
  cThing: ConsumedThing

  /**
   * Enable selecting a property. This shows a pointer cursor on the property name
   */
  enablePropSelect?: boolean

  /**
   * Enable editing of writable (non reaadonly) properties
   * Users must subscribe to onEditConfiguration(cThing,name,io) 
   */
  enableEditConfig?: boolean

  /**
   * Names of properties to show or undefined to show all properties in the cThing
   */
  propNames?: string[]

  /**
   *  Text to show when table has nothing else to show 
   */
  noDataLabel?: string
}>()

/**
 * Optional event when enabled
 * @args: [TD, propertyName, propertyAffordance]
 */
const emits = defineEmits([
  "onThingPropertySelect",
])


/** Aggregate info for displaying a property */
interface IPropertyDisplayInfo {
   /** name of property to show */
   name: string
   /** The property affordance, eg schema of the property */
   pa: TDPropertyAffordance
   /** latest property value */
   io: InteractionOutput 
}

/**
 * Writable properties are editable. Notify of the request to edit.
 */
const handleEditConfiguration = (propInfo:IPropertyDisplayInfo) => {
  console.log("ThingPropertiesTable.handleEditConfiguration: propertyName=", propInfo.name)
  $q.dialog({
     component: EditConfigDialog,
     componentProps: {
       propName: propInfo.name,
       affordance: propInfo.pa,
       currentValue: propInfo.io
      },
  }).onOk( (newValue:string)=>{
    console.log("ThingPropertiesTable.handleEditConfiguration: props:", newValue)
    props.cThing.writeProperty(propInfo.name, newValue)
  })

}

/**
 * Select property 
 */
const handleThingPropertySelect = (propInfo:IPropertyDisplayInfo)=>{
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
const propertiesToShow = (cThing:ConsumedThing, propNames?:string[]): Array<IPropertyDisplayInfo> => {
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
    title: "Title", 
    field: "pa.title",
    // maxWidth: "0",
    // width: "50%",
    component: (row:IPropertyDisplayInfo) => h('span', 
      { 
        style: (props.enablePropSelect ? 'cursor:pointer':''), 
        onClick: ()=>handleThingPropertySelect(row),
      }, 
      {default: ()=>row.pa.title}
    ),
  }, {
    title: "Property Name", 
    field: "pa.name",
    hidden: true,
    // maxWidth: "0",
    // width: "50%",
    component: (row:IPropertyDisplayInfo) => h('span', 
      { 
        style: (props.enablePropSelect ? 'cursor:pointer':''), 
        onClick: ()=>handleThingPropertySelect(row),
      }, 
      {default: ()=>row.name}
    ),
  }, {
    title: "Value", 
    // maxWidth: "0",
    // width: "50%",
    field: "io.value",
    component: (row:IPropertyDisplayInfo)=>
      h('span', {style:"display:flex"}, 
        [ row.io.asText, 
        // show edit button when not readonly
        !row.io.schema?.readOnly ? 
          h(QBtn, { flat:true, icon:matEdit, size:"md", padding:"none",
              style: "position:absolute; right:5px;",
              onClick: ()=>handleEditConfiguration(row)
              }) : null
        ]
      )
  }, {
    title: "Type", 
    field: "io.schema.type",
    width: "100px",
  }, {
    title:"Updated", field:"io.updated",
    component: (row:IPropertyDisplayInfo)=>h(TAge,
     {timeStamp:row.io.updated, showTooltip:true} )

    // component: (row:IProperyDisplayInfo)=>h('span', {}, 
    //     // { default: ()=>isoTimeAgo(row.io.updated, currentTime.value)
    //     { default: ()=>isoAge(row.io.updated.toString())
    //     })
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