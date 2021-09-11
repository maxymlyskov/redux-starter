import configureStore from "./store/configureStore";
import { loadBugs, addBug, resolveBug, assignedToUser } from "./store/bugs";

const store = configureStore();

// store.dispatch(addBug({ description: "a" }));
store.dispatch(loadBugs());
setTimeout(() => {
  store.dispatch(assignedToUser(1, 4));
}, 2000);
