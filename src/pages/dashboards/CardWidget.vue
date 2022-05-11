<script lang="ts" setup>

import {QLinearProgress, QBadge} from "quasar";
import {DashboardTileConfig, IDashboardTileItem} from "@/data/dashboard/DashboardStore";
import {TDPropertyAffordance} from "@/data/thing/ThingTD";
import { ref } from "vue";
import TileItemsTable from "./TileItemsTable.vue";
import { ThingFactory } from "@/data/protocolbinding/ThingFactory";
import { DateTime } from "luxon";
import { currentTime } from "@/data/timeAgo";

const props= defineProps<{
  tile:DashboardTileConfig
  thingFactory: ThingFactory
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
  let cThing = props.thingFactory.consumeWithID(item.thingID)
  let propIO = cThing?.properties.get(item.propertyName)
  let tdProp = cThing?.td.properties[item.propertyName]
  if (!tdProp || !propIO) {
    // Thing info not available
    // return "Property '"+item.propertyID+"' not found"
    return "N/A"
  }
  let valueStr = propIO.value + " " + (tdProp.unit ? tdProp.unit:"")
  return valueStr
}

/**
 * Lookup the property age of a tile item 
 */
const getPropAge = (item:IDashboardTileItem):string => {
  if (!item ) {
    return "n/a"
  }
  let cThing = props.thingFactory.consumeWithID(item.thingID)
  let propIO = cThing?.properties.get(item.propertyName)
  if (!propIO) {
    // Thing info not available
    // return "Property '"+item.propertyID+"' not found"
    return "n/a"
  }
  let valueStr = propIO.getUpdatedShortText()
  return valueStr
}

/**
 * Lookup the property age fraction of 12 hours (0..1)
 * This is a computed function that uses 'currentTime' to periodically auto-update the age
 * Intended to show an 'age bar'.
 */
const getAgeFractionOfDay = (item:IDashboardTileItem):number => {
  if (!item ) {
    return 0
  }
  let cThing = props.thingFactory.consumeWithID(item.thingID)
  let propIO = cThing?.properties.get(item.propertyName)
  if (!propIO) {
    // Thing info not available
    // return "Property '"+item.propertyID+"' not found"
    return 0
  }
  let age = currentTime.value.diff(propIO.updated, 'seconds')
  let ageFraction = age.seconds / (12*3600)
  return ageFraction
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
        :thingFactory="props.thingFactory"
        :no-type-col="!props.tile?.showType"
        grow
        flat dense
        noBorder noHeader
    />
  </div>
  <div v-else-if="props.tile.items?.length==1"
    class="card-widget"
  >
    <p v-show="props.tile.showType" class="item-type">
      {{item0.propertyName}}
    </p>

    <p class="card-value single-item-card">
      {{getThingPropValue(props.tile?.items[0])}}
    </p>

    <q-linear-progress size="25px" color="red" track-color="blue"
    class="card-bottom" :value="getAgeFractionOfDay(item0)" >
      <div class="absolute-full flex flex-center">
        <q-badge color="white" text-color="teal" 
        :label="getPropAge(item0)" 
        />
      </div>
    </q-linear-progress>
  </div>
  <div v-else class="card-widget">
      <p>Tile has no items.</p>
      <p>Please configure.</p>
  </div>
</template>

<style scoped>
.item-type {
  margin-bottom: 0;
  font-size: 0.9em;
  font-style: italic; 
}
.card-value {
  flex-grow: 1;
  display:flex;
  flex-direction: column;
  justify-content: center;
  margin: 0;
}
.card-widget {
  padding: 0px;
  border-style: solid;
  box-shadow: none;
  border: thick black;
  margin: 0px;
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