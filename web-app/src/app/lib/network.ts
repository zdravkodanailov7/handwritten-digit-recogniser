interface SerializedNetwork {
    sizes: number[];
    weights: number[][][];
    biases: number[][][];
}

export class Network {
    sizes: number[];
    weights: number[][][];
    biases: number[][][];
  
    constructor(jsonData: SerializedNetwork) {
      this.sizes = jsonData.sizes;
      this.weights = jsonData.weights;
      this.biases = jsonData.biases;
    }
  
    sigmoid(z: number): number {
      return 1 / (1 + Math.exp(-z));
    }
  
    feedforward(input: number[]): number[] {
      let activation = input.slice();
      for (let i = 0; i < this.weights.length; i++) {
        const layerWeights = this.weights[i];
        const layerBiases = this.biases[i];
        const newActivation: number[] = [];
        for (let j = 0; j < layerWeights.length; j++) {
          let z = layerBiases[j][0];
          for (let k = 0; k < layerWeights[j].length; k++) {
            z += layerWeights[j][k] * activation[k];
          }
          newActivation.push(this.sigmoid(z));
        }
        activation = newActivation;
      }
      return activation;
    }
  }
  
  export async function loadNetwork(): Promise<Network> {
    const res = await fetch('/trained_digit_net.json');
    const data = await res.json();
    return new Network(data);
  }