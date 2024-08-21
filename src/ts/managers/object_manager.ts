// Helps us retrieve JS objects by HTML ID
// We can get corresponding div elements by document.getElementById()
class ObjectManager {
    map: Map<string, Object>;

    constructor() {
        this.map = new Map();
    }

    associate(divId: string, obj: Object) {
        this.map.set(divId, obj);
    }

    getObject(divId: string): Object {
        return this.map.get(divId);
    }

}

export {ObjectManager}