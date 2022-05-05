<script lang="ts" setup>

import {QCard, QCardSection, QLinearProgress, QBadge} from "quasar";
import {DashboardTileConfig, IDashboardTileItem} from "@/data/dashboard/DashboardStore";
// import {ThingStore} from "@/data/thing/ThingStore";
import {TDPropertyAffordance} from "@/data/thing/ThingTD";
import { ref } from "vue";
import TileItemsTable from "./TileItemsTable.vue";
import { ConsumedThingFactory } from "@/data/protocolbinding/ConsumedThingFactory";
import { DateTime } from "luxon";
import { time } from "console";
import PropValueInfoPopup from "./PropValueInfoPopup.vue";

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

/**
 * Lookup the property age of a tile item 
 */
const getPropAge = (item:IDashboardTileItem):string => {
  if (!item ) {
    return "n/a"
  }
  let cThing = props.cThingFactory.consumeWithID(item.thingID)
  let propIO = cThing?.properties.get(item.propertyID)
  if (!propIO) {
    // Thing info not available
    // return "Property '"+item.propertyID+"' not found"
    return "n/a"
  }
  let valueStr = propIO.getUpdatedShortText()
  return valueStr
}

/**
 * Lookup the property age fraction of 24 hours (0..1)
 */
const getAgeFractionOfDay = (item:IDashboardTileItem):number => {
  if (!item ) {
    return 0
  }
  let cThing = props.cThingFactory.consumeWithID(item.thingID)
  let propIO = cThing?.properties.get(item.propertyID)
  if (!propIO) {
    // Thing info not available
    // return "Property '"+item.propertyID+"' not found"
    return 0
  }
  let valueStr = propIO.getUpdatedShortText()
  let age = DateTime.now().diff(propIO.updated, 'seconds')
  let ageFraction = age.seconds / (24*3600)
  console.log("getAgeFractionOfDay. sec=%s fraction=%s", age.seconds, ageFraction)
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
        :cThingFactory="props.cThingFactory"
        grow
        flat dense
        noBorder noHeader
    />
  </div>
  <div v-else-if="props.tile.items?.length==1"
    class="card-widget single-item-card"
  >
    <p class="card-value">
      {{getThingPropValue(props.tile?.items[0])}}
    </p>

    <q-linear-progress size="25px" color="red" track-color="blue"
    class="card-bottom" :value="getAgeFractionOfDay(item0)" >
      <div class="absolute-full flex flex-center">
        <q-badge color="white" text-color="teal" 
        :label="getPropAge(props.tile?.items[0])" 
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