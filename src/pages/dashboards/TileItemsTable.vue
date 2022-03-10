<script lang="ts" setup>

import {h, VNode, VNodeArrayChildren} from 'vue'
import { get as _get} from 'lodash-es'
import { matRemove, matEdit } from '@quasar/extras/material-icons';
import { QTooltip } from 'quasar';

import TButton from '@/components/TButton.vue'
import TSimpleTable from '../../components/TSimpleTable.vue';
import TText from '@/components/TText.vue'

import { IDashboardTileItem } from '@/data/dashboard/DashboardStore';
import { ThingStore } from '@/data/td/ThingStore';
import { TDProperty, ThingTD } from '@/data/td/ThingTD';
import { ISimpleTableColumn } from '@/components/TSimpleTable.vue';
import { PropNameDeviceType, PropNameName } from '@/data/td/Vocabulary';


/**
 * This component shows a table with the items name and value from a dashboard tile
 */


const props = defineProps<{
  /**
   * Reduce padding to compact layout
   */
  dense?: boolean
  /**
   * In edit mode show the remove item button as first column
   */
  editMode?: boolean
  /**
   * Hide the border box
   */
  flat?: boolean
  /**
   * Grow row content to use the available height
   */
  grow?: boolean
  /**
   * Hide the table border
   */
  noBorder?: boolean
  /**
   * Hide the header
   */
  noHeader?: boolean
  /**
   * The rows to display
   */
  tileItems:IDashboardTileItem[]
  /**
   * Lookup item values from this store
   */
  thingStore: ThingStore
}>()

const emits = defineEmits([
  "onRemoveTileItem", 
  // @param: IDashboardTileItem
  "onEditTileItem"
  ])

// Thing Property item to display
interface IThingTileItem {
  key: string,
  tileItem: IDashboardTileItem,
  td?: ThingTD,
  tdProp?: TDProperty,
}

/**
 * Return the list of Thing tile items from a dashboard tile item list
 */
const getThingTileItems = (tileItems:IDashboardTileItem[]|undefined): 
  IThingTileItem[] => {

  let itemAndProps: IThingTileItem[] = []
  if (tileItems) {
    tileItems.forEach(tileItem=>{
      let td = props.thingStore.GetThingTDById(tileItem.thingID)
      if (!td) {
        // FIXME: when not connected. Should the item still be shown with a N/A value?
        console.warn("TileItemsTable.getThingTileItems. Missing TD '%s'", tileItem.thingID)
        itemAndProps.push({
          key: tileItem.thingID+"."+tileItem.propertyID,
          tileItem: tileItem, 
          // td: td,
          // tdProp: tdProp,
        })
        return
      }
      let tdProp = td.properties[tileItem.propertyID]
      if (!tdProp) {
        console.warn("TileItemsTable.getThingTileItems. Missing prop '%s' in TD '%s'", tileItem.propertyID, tileItem.thingID)
      }
      itemAndProps.push({
        key: tileItem.thingID+"."+tileItem.propertyID,
        tileItem: tileItem, 
        td: td,
        tdProp: tdProp,
      })
    })
  }
  // console.log("TileItemsTable.getThingTileItems. dashboard items count=",items?.length, ". Tile items count=", itemAndProps.length)
  return itemAndProps
}

const getThingPropValue = (thingItem:IThingTileItem):string => {
  if (!thingItem || !thingItem.tdProp) {
    return "n/a"
  }
  let valueStr = thingItem.tdProp.value + " " + (thingItem.tdProp?.unit ? thingItem.tdProp?.unit:"")
  return valueStr
}

/**
 * Return the tile item label with edit button to customize the label
 * The property name is the customized property label or its TD name - property name 
 *  
 * This uses the thing's name or description if name is not configured
 * A tooltip shows more info.
 * Property name edit button is shown in edit mode and triggers a name edit dialog.
 */
const getTileItemLabel = (thingItem:IThingTileItem):VNode => {
  // 1: The item defined label takes precedence
  let propName = thingItem.tileItem.label
  let tdProp = thingItem.tdProp
  let defaultLabel = ""

  if (thingItem.td && tdProp) {
    defaultLabel = tdProp.title
    
    // prefix default label with the thing's name if available
    // let pn = ThingTD.GetThingProperty(thingItem.td, PropNameName)
    let pn = ThingTD.GetThingProperty(thingItem.td, 'Name')
    if (pn) {
      defaultLabel = pn.value + " " + defaultLabel
    }
  }
  if (propName == "") {
    propName = defaultLabel
  }

  // note: the following tooltip construct is horrid. Is there a more readable way?
  let comp = h('span', 
              {style: 'width:"100%"; display:flex'},
              [ propName,
                props.editMode ? 
                h(TButton, {
                  icon:matEdit, round:true, dense:true, flat:true, height:'10px', 
                  style: "min-width: 1.5em; position: absolute; right:0",
                  tooltip:"Edit name",
                  onClick: ()=>handleEditLabel(thingItem.tileItem, defaultLabel)
                }):null,
              ]
  )

  return comp
}

/**
 * Return a tooltip of the tile item that includes more information
 *  
 */
const getTileItemTooltip = (thingItem:IThingTileItem):VNode => {
  // 1: The item defined label takes precedence
  // tooltip text is the Thing's description - property ID
  let tooltip1 = thingItem.td?.description + "; " + thingItem.tileItem.propertyID
  tooltip1 += " (" + thingItem.td?.deviceType + ")"
  let tooltip2 = "Thing ID: " + thingItem.td?.id

  // note: the following tooltip construct is horrid. Is there a more readable way?
  let comp = h(QTooltip, 
              { style: 'font-size:inherit' },
              ()=>[h('p',tooltip1), h('p',tooltip2)]
  )
  
  return comp
}

/**
 * User clicked the 'remove' button while in edit mode
 */
const handleRemove = (row:IThingTileItem) => {
  console.log("TileItemsTable.handleRemove: row=", row)
  emits("onRemoveTileItem", row.tileItem)
}

/**
 * Edit the tile property display name
 */
const handleEditLabel = (tileItem:IDashboardTileItem, defaultLabel: string) => {
  console.log("TileItemsTable.handleEditName: item=", defaultLabel)

  emits("onEditTileItem", tileItem, defaultLabel)
}

/**
 * Thing properties table columns 
 *   display items from IThingTileItem 
 */
const getColumns = (editMode:boolean|undefined):ISimpleTableColumn[] => {
  return [ {
    // show the 'remove' button only in edit mode
      title: "", 
      width:"35px", 
      // maxWidth: "35px",
      field:"remove", 
      align:'center', 
      hidden: !props.editMode,
      component:(row:IThingTileItem)=>h(TButton,{
          icon:matRemove, round:true, dense:true, flat:true, height:'10px', 
          style: "min-width: 1.5em",
          tooltip:"Remove property from tile",
          onClick: ()=>handleRemove(row),
        }),
    }, {
      // Show property name. TODO: use label field
      title: "Property Name", 
      field: "tdProp.title", 
      width: "60%",
      component: (row:IThingTileItem)=>h('span',
         {'style': 'width:"100%"'},
         [getTileItemLabel(row),
         getTileItemTooltip(row)
          ]
      ),
      align: 'left'
    }, {
      // show value and unit
      title: "Value", 
      field: "tdProp.value",
      // width: "50%",
      // maxWidth: "0",
      component: (row:IThingTileItem)=>h('span', {}, 
        { default: ()=>getThingPropValue(row) }
      )
    }
  ]
}
</script>


<template>
    <TSimpleTable 
        :columns="getColumns(props.editMode)"
        :rows="getThingTileItems(props.tileItems)"
        :flat="props.flat"
        :no-border="props.noBorder"
        :no-header="props.noHeader"
        :grow="props.grow"
        :dense="props.dense"
        empty-text="Please add tile properties..."
    />
</template>

