function getZScore(y, SE, target) {
    return y.map(
        (d, idx) => (d - target) / SE[idx]
    );
}

export default getZScore;