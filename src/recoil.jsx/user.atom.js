import { atom } from "recoil";

const localStorageEffect = key => ({ setSelf, onSet }) => {
    const savedValue = localStorage.getItem(key);
    if (savedValue != null) {
        try {
            setSelf(JSON.parse(savedValue));
        } catch (err) {
            console.error("Failed to parse user data from localStorage:", err);
        }
    }

    onSet(newValue => {
        if (newValue === null) {
            localStorage.removeItem(key);
        } else {
            localStorage.setItem(key, JSON.stringify(newValue));
        }
    });
};

export const userDataState = atom({
    key: "userDataState",
    default: null,
    effects_UNSTABLE: [localStorageEffect("userData")]
});
