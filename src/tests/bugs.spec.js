import bugs, {
  addBug,
  assignedToUser,
  getBugsByUser,
  getUnresolvedBugs,
  loadBugs,
  resolveBug,
} from "../store/bugs";
import configureStore from "../store/configureStore";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";

describe("bugs silce", () => {
  let fakeAxios;
  let store;

  beforeEach(() => {
    fakeAxios = new MockAdapter(axios);
    store = configureStore();
  });
  const bugsSlice = () => store.getState().entities.bugs;
  const createState = () => ({
    entities: {
      bugs: {
        list: [],
      },
    },
  });

  it("should add the bug to the store if it`s saved to the server", async () => {
    const bug = { description: "a" };
    const savedBug = { ...bug, id: 1 };
    fakeAxios.onPost("/bugs").reply(200, savedBug);

    await store.dispatch(addBug(bug));

    expect(bugsSlice().list).toContainEqual(savedBug);
  });
  it("should  not add the bug to the store if it`s not saved to the server", async () => {
    const bug = { description: "a" };
    fakeAxios.onPost("/bugs").reply(500);

    await store.dispatch(addBug(bug));

    expect(bugsSlice().list).toHaveLength(0);
  });

  it("should assign bug to user of the server", async () => {
    fakeAxios.onPatch("/bugs/1").reply(200, { id: 1, userId: 1 });
    fakeAxios.onPost("/bugs").reply(200, { id: 1 });

    await store.dispatch(addBug({}));
    await store.dispatch(assignedToUser(1));

    expect(bugsSlice().list[0].userId).toBe(1);
  });

  it("should mark the bug as resolved if it's patched on the server", async () => {
    fakeAxios.onPatch("/bugs/1").reply(200, { id: 1, resolved: true });
    fakeAxios.onPost("/bugs").reply(200, { id: 1 });

    await store.dispatch(addBug({}));
    await store.dispatch(resolveBug(1));

    expect(bugsSlice().list[0].resolved).toBe(true);
  });

  describe("selectors", () => {
    it("should get unresolved bugs", () => {
      const state = createState();
      state.entities.bugs.list = [
        { id: 1, resolved: true },
        { id: 2 },
        { id: 3 },
      ];

      const result = getUnresolvedBugs(state);

      expect(result).toHaveLength(2);
    });
  });
  it("should assign bug to user of the server", () => {
    const state = createState();
    state.entities.bugs.list = [{ id: 1, userId: 5 }, { id: 2 }, { id: 3 }];

    const result = getBugsByUser(5)(state);

    expect(result[0].userId).toBe(5);
  });
  describe("if the bugs don`t exist in the cache", () => {
    it("they should be fetched from the server and put to the store", async () => {
      fakeAxios.onGet("/bugs").reply(200, [{ id: 1 }]);

      await store.dispatch(loadBugs());

      expect(bugsSlice().list).toHaveLength(1);
    });
  });
  describe("loading bugs", () => {
    describe("if they exist in cache", () => {
      it("should not fetching the same data from the server more than one rep", async () => {
        fakeAxios.onGet("/bugs").reply(200, [{ id: 1 }]);

        await store.dispatch(loadBugs());
        await store.dispatch(loadBugs());

        expect(fakeAxios.history.get.length).toBe(1);
      });
    });
    describe("if they don`t exist in cache", () => {
      describe("loading indicator", () => {
        it("should be true while fetching", () => {
          fakeAxios.onGet("/bugs").reply(() => {
            expect(bugsSlice().loading).toBe(true);
            return [200, { id: 1 }];
          });

          store.dispatch(loadBugs());
        });
        it("should be false after fetching", async () => {
          fakeAxios.onGet("/bugs").reply([200, { id: 1 }]);

          await store.dispatch(loadBugs());

          expect(bugsSlice().loading).toBe(false);
        });
        it("should be false while catching an error", async () => {
          fakeAxios.onGet("/bugs").reply(500);

          await store.dispatch(loadBugs());

          expect(bugsSlice().loading).toBe(false);
        });
      });
    });
  });
});
