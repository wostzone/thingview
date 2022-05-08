<script lang="ts" setup>

import {h, VNode} from 'vue'
import { get as _get} from 'lodash-es'
import { matRemove, matEdit } from '@quasar/extras/material-icons';
import { QTooltip } from 'quasar';

import TButton from '@/components/TButton.vue'
import TSimpleTable from '../../components/TSimpleTable.vue';
import PropValueInfoPopup from './PropValueInfoPopup.vue';

import { IDashboardTileItem } from '@/data/dashboard/DashboardStore';
import { ISimpleTableColumn } from '@/components/TSimpleTable.vue';
import { PropNameName } from '@/data/thing/Vocabulary';
import { ConsumedThing } from '@/data/thing/ConsumedThing';
import { ThingFactory } from '@/data/protocolbinding/ThingFactory';
import InteractionOutput from '@/data/thing/InteractionOutput';
import { timeAgo } from '@/data/timeAgo';
import { DateTime } from 'luxon';


/**
 * Table with tile item name and value
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
   * Create consumed thing instances of a Thing for interaction
   */
  thingFactory: ThingFactory
}>()

const emits = defineEmits([
  "onRemoveTileItem", 
  // @param: IDashboardTileItem
  "onEditTileItem"
  ])

/** Thing Property item to display  */
interface IThingTileItem {
  /** unique key of the item for display in collection */
  key: string,
  /** the dashboard line item definition */
  tileItem: IDashboardTileItem,
  /** consumed thing for this property */
  cThing?: ConsumedThing
  /** The item property output */
  propIO?: InteractionOutput
}

/**
 * Return the list of Thing tile items to display, including thing instance property values
 */
const getThingTileItems = (tileItems:IDashboardTileItem[]|undefined): 
  IThingTileItem[] => {

  let itemAndProps: IThingTileItem[] = []
  if (tileItems) {
    tileItems.forEach(tileItem=>{
      let cThing = props.thingFactory.consumeWithID(tileItem.thingID)
      // let td = props.thingStore.getThingTDById(tileItem.thingID)
      if (!cThing) {
        console.warn("TileItemsTable.getThingTileItems. Unknown thing with ID '%s'", tileItem.thingID)
        itemAndProps.push({
          key: tileItem.thingID+"."+tileItem.propertyID,
          tileItem: tileItem, 
          // td: td,
          // tdProp: tdProp,
        })
        return
      }
      // property values are provided through the 'consumed thing'
      // let cThing = props.cThingFactory?.consume(td)
      // let tdProp = td.properties[tileItem.propertyID]
      let propIO = cThing.properties.get(tileItem.propertyID)
      if (!propIO) {
        console.warn("TileItemsTable.getThingTileItems. Missing prop '%s' in TD '%s'", tileItem.propertyID, tileItem.thingID)
      }
      itemAndProps.push({
        key: tileItem.thingID+"."+tileItem.propertyID,
        tileItem: tileItem, 
        cThing: cThing,
        propIO: propIO,
        // tdProp: tdProp,
      })
    })
  }
  // console.log("TileItemsTable.getThingTileItems. dashboard items count=",items?.length, ". Tile items count=", itemAndProps.length)
  return itemAndProps
}

const getThingPropValue = (thingItem:IThingTileItem):string => {
  if (!thingItem || !thingItem.cThing) {
    return "n/a"
  }
  let propName  = thingItem.tileItem.propertyID
  let [valueStr] = thingItem.cThing.getPropertyValueText(propName)
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
  // The configured label takes precedence
  let propLabel = thingItem.tileItem.label
  let defaultLabel = ""

  if (thingItem.propIO?.schema) {
    defaultLabel = thingItem.propIO.schema.title
    
    // prefix default label with the thing's 'Name' property if available
    let nameProp = thingItem.cThing?.properties.get(PropNameName)
    if (nameProp && nameProp.value) {
      defaultLabel = nameProp.value + " " + defaultLabel
    }
  }
  if (!propLabel) {
    propLabel = defaultLabel
  }
  // console.log("--- tileitemlabel=",propLabel)

  let comp = h('span', 
              {style: 'width:"100%"; display:flex'},
              [ propLabel,
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
const getTileItemTooltip = (thingItem:IThingTileItem, now:DateTime):VNode => {
  let comp = h(QTooltip, 
              { style: 'font-size:inherit' },
                ()=>h(PropValueInfoPopup, {
                  cThing: thingItem.cThing, 
                  propName:thingItem.tileItem.propertyID
                  }),
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
        //  getTileItemTooltip(row, DateTime.now())
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
        [getThingPropValue(row),
         getTileItemTooltip(row, DateTime.now())
         ]
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

