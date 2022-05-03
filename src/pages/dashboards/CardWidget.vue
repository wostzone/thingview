<script lang="ts" setup>

import {QCard, QCardSection} from "quasar";
import {DashboardTileConfig, IDashboardTileItem} from "@/data/dashboard/DashboardStore";
// import {ThingStore} from "@/data/thing/ThingStore";
import {TDPropertyAffordance} from "@/data/thing/ThingTD";
import { ref } from "vue";
import TileItemsTable from "./TileItemsTable.vue";
import { ConsumedThingFactory } from "@/data/protocolbinding/ConsumedThingFactory";

const props= defineProps<{
  tile:DashboardTileConfig
  // thingStore: ThingStore
  cThingFactory: ConsumedThingFactory
}>()

interface IDisplayItem {
  label: string
  property?: TDPropertyAffordance
}

/**
 * Get array of thing attributes to display on the tile
 * This returns an array of items: [{thingID, thingAttr}]
 */
// const getThingsProperties = (items:IDashboardTileItem[]): IDisplayItem[] => {
//   let res = new Array<IDisplayItem>()
//   items.forEach( (item: IDashboardTileItem) => {
//     let td =props.thingStore.getThingTDById(item.thingID)
//     let tdProp:TDPropertyAffordance|undefined = td?.properties[item.propertyID]
//     let di:IDisplayItem = {label: item.propertyID, property:tdProp}
//     res.push(di)
//   })
//   return res
// }

/**
 * Lookup the property value of a tile item 
 */
const getThingPropValue = (item:IDashboardTileItem):string => {
  if (!item) {
    return "Missing value"
  }
  let cThing = props.cThingFactory.consumeWithID(item.thingID)
  let propIO = cThing?.properties.get(item.propertyID)
  let tdProp = cThing?.td.properties[item.propertyID]
  if (!tdProp || !propIO) {
    // Thing info not available
    // return "Property '"+item.propertyID+"' not found"
    return "N/A"
  }
  let valueStr = propIO.value + " " + (tdProp.unit ? tdProp.unit:"")
  return valueStr
}

const item0 = ref(props.tile?.items?.[0])
// console.debug("CardWidget. props.config=", props.tile)

</script>

<template>
  <div v-if="props.tile.items && props.tile.items?.length>1"
    class="card-widget"
  >
    <TileItemsTable
        :tileItems="props.tile?.items"
        :cThingFactory="props.cThingFactory"
        grow
        flat dense
        noBorder noHeader
    />
  </div>
  <div v-else-if="props.tile.items?.length==1"
    class="card-widget single-item-card"
  >
      <!-- {{props.tile?.items[0].label}} -->
      <!-- <p>{{props.tile?.items[0].propertyID}}</p> -->
      <p>{{getThingPropValue(props.tile?.items[0])}}</p>
      
  </div>
  <div v-else class="card-widget">
      <p>Tile has no items.</p>
      <p>Please configure.</p>
  </div>
</template>

<style>
.card-widget {
  padding: 0px;
  box-shadow: none;
  border: 0;
  margin: 0;
  height: 100%;
  width: 100%;
  display:flex;
  flex-direction: column;
  justify-content: center;
}

.single-item-card {
  font-size: 1.2rem;
  font-weight: bold;
}
</style>