const KEY = "PDF_SHELF_HISTORY"

export function getHistory(id:string) {
    const text = localStorage.getItem(KEY)
    const history = text ? JSON.parse(text) : {};
    return history[id];
}

export function setHistory(id:string, page:number) {
    const text = localStorage.getItem(KEY)
    const history = text ? JSON.parse(text) : {};
    history[id] = page;
    localStorage.setItem(KEY, JSON.stringify(history));
}