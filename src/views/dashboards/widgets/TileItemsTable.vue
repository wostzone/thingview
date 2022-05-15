<script lang="ts" setup>

import {h, VNode} from 'vue'
import { get as _get} from 'lodash-es'
import { matRemove, matEdit } from '@quasar/extras/material-icons';
import { useQuasar, QToggle, QTooltip } from 'quasar';

import TButton from '@/components/TButton.vue'
import TSimpleTable from '@/components/TSimpleTable.vue';
import PropValueInfoPopup from './PropValueInfoPopup.vue';

import { IDashboardTileItem } from '@/data/dashboard/DashboardStore';
import { ISimpleTableColumn } from '@/components/TSimpleTable.vue';
import { PropNameName, PropNameOnOffSwitch, PropNameRelay, PropNameSwitch } from '@/data/thing/Vocabulary';
import { ConsumedThing } from '@/data/thing/ConsumedThing';
import { ThingFactory } from '@/data/protocolbinding/ThingFactory';
import {InteractionOutput} from '@/data/thing/InteractionOutput';
import { DateTime } from 'luxon';
import { TDPropertyAffordance } from '@/data/thing/ThingTD';

const $q = useQuasar()

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
   * Hide the type column
   */
  noTypeCol?: boolean
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
  /** the affordance describing the property */
  affordance?: TDPropertyAffordance
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
          key: tileItem.thingID+"."+tileItem.propertyName,
          tileItem: tileItem, 
        })
        return
      }
      // property values are provided through the 'consumed thing'
      // let cThing = props.cThingFactory?.consume(td)
      let tdProp = cThing.td.properties[tileItem.propertyName]
      let propIO = cThing.properties.get(tileItem.propertyName)
      // let propIO = cThing.properties.get(tileItem.propertyID)
      if (!propIO) {
        console.warn("TileItemsTable.getThingTileItems. Missing prop '%s' in TD '%s'", tileItem.propertyName, tileItem.thingID)
      }
      itemAndProps.push({
        affordance: tdProp,
        key: tileItem.thingID+"."+tileItem.propertyName,
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

/**
 * Return the item value component. 
 * This can be a switch or plain text.
 */
const getThingPropValue = (thingItem:IThingTileItem):VNode => {
  if (!thingItem || !thingItem.cThing) {
    return h("span", "n/a")
  }
  let propName  = thingItem.tileItem.propertyName

  switch(thingItem.tileItem.propertyName) {
  case PropNameSwitch: 
  case PropNameOnOffSwitch: 
  case PropNameRelay: 
  {
    let value = thingItem.propIO?.asBoolean
    // toggle is enabled if it has action  
    let hasAction = thingItem.cThing.td.actions[propName]
    return h(QToggle, {
      modelValue: value, 
      label: value ? "On" : "Off",
      disable: !hasAction, 
      onClick: (value, evt)=>{
        console.log("Trigger toggle action")
        $q.notify({type:'positive', message: "Requested toggle of "+propName })
        thingItem.cThing?.invokeAction(propName, !value)
      },
      // onUpdate doesn't work in spite of documentation that mentions it
      // onUpdate: (value, evt)=>{
      //   console.log("Trigger update")
      // }
      })
    break
  }
  default:
    let value = thingItem.propIO? thingItem.propIO.asText : "n/a"
    return h('span', value)
  }
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
                  propName:thingItem.tileItem.propertyName
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
      // Show property name. 
      title: "Property Name", 
      field: "affordance.title", 
      // width: "50%",
      component: (row:IThingTileItem)=>h('span',
         {'style': 'width:"100%"'},
         [getTileItemLabel(row),
        //  getTileItemTooltip(row, DateTime.now())
          ]
      ),
      align: 'left'
    }, {
      // what type, temperature, humidity? 
      title: "type",
      field: "tileItem.propertyName",
      hidden: props.noTypeCol
    }, {
      // show value and unit
      title: "Value", 
      field: "propIO.value",
      // width: "50%",
      width: "120px",
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

