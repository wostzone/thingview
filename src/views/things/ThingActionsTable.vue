<script setup lang="ts">

import { TDActionAffordance } from "@/data/thing/ThingTD";
import TSimpleTable, { ISimpleTableColumn } from "@/components/TSimpleTable.vue";
import { ConsumedThing } from "@/data/thing/ConsumedThing";
import { useQuasar, QBtn } from "quasar";
import { h } from "vue";
import EditInputDialog from "./EditInputDialog.vue";

const $q = useQuasar()

const props= defineProps<{
  cThing: ConsumedThing
  }>()

/**
 * Action affordance with the name added 
 */
interface IActionInfo {
  name: string
  affordance: TDActionAffordance
}

/** get action input type(s) to show in the table
 */
const getInputTypes = (action: IActionInfo) => {
  if (action.affordance.input) {
    return action.affordance.input.type
  }
  return "n/a"
}

const getActionList = (cThing:ConsumedThing): IActionInfo[] => {
  let names = new Array<string>()
  if (cThing.td.actions) {
    Object.entries(cThing.td.actions).forEach(([name]) => {
        names?.push(name)
    })
  }

  let actionList = names.map((name:string)=>{
    let aa = cThing.td.actions[name]
    return {
      affordance: aa,
      name:name,
    }
  })
  return actionList
}

/** Popup input form 
 */
const handleStartAction = (cThing:ConsumedThing, action:IActionInfo) =>{
  // let params = Object()
  let params = "1"

  $q.dialog({
     component: EditInputDialog,
     componentProps: {
       actionName: action.name,
       affordance: action.affordance,
      },
  }).onOk( (value:string)=>{
    console.log("ThingActionsTable.handleStartAction: props:", value)
    props.cThing.invokeAction(action.name, value)
  })

}



// columns to display action
const actionColumns = <Array<ISimpleTableColumn>>[
  {title: "Action Name", field:"affordance.title", align:"left", sortable:true},
  // {title: "Description", field:"description", align:"left"
  // },
  {title: "Input", field:"inputs", align:"left",
  component: (row:IActionInfo) => h('span', {}, getInputTypes(row))
  },
  {title: "", field:"inputs", align:"center", width: "160px",
  component: (row:IActionInfo) => h(QBtn, {
    color:"primary", label:"Start...",
    onClick: ()=>handleStartAction(props.cThing, row)
    })
  },
]


</script>



<template>

  <TSimpleTable row-key="id"
          dense
          :columns="actionColumns"
          :rows="getActionList(props.cThing)"
          noDataLabel="This Thing does not accept any actions"
  />

</template>