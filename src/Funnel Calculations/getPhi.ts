import * as mathjs from "mathjs";

function getPhi(z_adj) {
    return mathjs.divide(mathjs.sum(mathjs.square(z_adj)), z_adj.length);
}

export default getPhi;