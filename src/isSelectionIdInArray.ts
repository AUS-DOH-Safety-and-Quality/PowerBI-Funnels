
function isSelectionIdInArray(selectionIds, selectionId): boolean {
    if (!selectionIds || !selectionId) {
        return false;
    }

    return selectionIds.some(currentSelectionId => {
        return currentSelectionId.includes(selectionId);
    });
}

export default isSelectionIdInArray;