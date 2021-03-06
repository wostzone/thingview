/**
 * Router for dashboard and things views
 */
import {
  createWebHistory,
  createRouter,
  RouteRecordRaw,
  createWebHashHistory,
} from "vue-router";

import DialogRouterView from './DialogRouterView.vue'
import { accountStore, AccountRecord } from "@/data/accounts/AccountStore";

// Router constants shared between router and navigation components
// Should this move to router?index.ts
export const DashboardPrefix = "/dashboard"
export const AccountsRouteName = "accounts"
export const DashboardRouteName = "dashboard"
export const ThingsRouteName = "things"

// Get the account of the given ID or undefined if the ID is not found
const getAccount = (id:string): AccountRecord|undefined => {
  let account = accountStore.getAccountById(id)
  if (!account) {
    console.log("Router getAccount id: ", id, 'is new.')
    return
  }
  console.log("Router getAccount id: ", id, 'found.')
  return account
}

/** Router paths and components
 * Use dynamic components to reduce chunk size
 */
const routes: Array<RouteRecordRaw> = [
  // List of accounts
  {
    // name: AccountsRouteName,
    path: "/accounts",
    // use dynamic loading to reduce load waits
    // component: () => import("@/views/accounts/AccountsView.vue"),
    component: DialogRouterView,  // webstorm shows an error incorrectly
    children: [
      {
        // Display the list of saved accounts if no additional parameters are provided
        name: AccountsRouteName,
        path: '',
        component: () => import("@/views/accounts/AccountsView.vue"),
      },
      {
        // Display the list of accounts as background and a dialog showing the account details
        name: 'accounts.dialog',
        path: ':accountID',
        components: {
          default: () => import("@/views/accounts/AccountsView.vue"),
          // name 'dialog' matches the second router-view in EmptyRouterView
          dialog: () => import("@/views/accounts/EditAccountDialog.vue"),
        },
        props: {
          dialog: (route: any) => ({
            returnTo: {name: AccountsRouteName},
            account: getAccount(route.params.accountID)
          }),
        }
      },
    ]
  },
  // list of things
  {
    // This 'things' route supports nested dialogs
    // DialogRouterView displays both the things as the dialog
    //   name: ThingsRouteName,
      path: "/things",
      component: DialogRouterView,  // webstorm shows an error incorrectly
      children: [
        {
          // Display the list of things if no additional parameters are provided
          name: ThingsRouteName,
          path: '',
          component: () => import("@/views/things/ThingsView.vue"),
        },
        {
        // Display the list of things as background and a dialog showing the Thing details
        name: 'things.dialog',
        path: ':thingID',
        components: {
          default: () => import("@/views/things/ThingsView.vue"),
          // name 'dialog' matches the second router-view in EmptyRouterView
          dialog: () => import("@/views/things/ThingDetailsDialog.vue"),
        },
        props: {
          dialog: (route:any) => ({
            returnTo: {name:ThingsRouteName},
            // cThing: getConsumedThing(route.params.thingID)
            thingID: route.params.thingID
          }),
        }
      }
    ],
  },
  // selected dashboard
  {
    name: DashboardRouteName,
    path: DashboardPrefix + "/:dashboardName",
    component: () => import("@/views/dashboards/DashboardView.vue"),
    props: true,
  },
  // this doesn't work if the dashboard haven't yet been loaded
  // {
  //   path: '/dashboard', redirect: '/dashboard/' + getFirstDashboard()
  // },
  {
    // vue router 4 no longer keeps default redirect simple
    // path: '*', redirect: '/',
    path: '/:pathMatch(.*)*', redirect: '/accounts'
  }

];

const router = createRouter({
  // history: createWebHistory(),
  history: createWebHashHistory(),
  routes,
});


export default router;
