// This script is purely in JavaScript and is not transpiled from TypeScript because it is a pure PAIN IN THE FUCKING ASS to deal with seperate global scopes in typescript WITHOUT node type definitions.
// The solution is to of course break all the semantics I've built up to this point and write a simple JS plain file. Are you shitting me? Why is this so difficult and hard anyway?
// This is also purely in JS because I would genuinely rather DIE DIE DIE PERISH than implement this in WASM (it was a cool idea, until it wasn't)

// Code is so fucking lifted deal with it
// FIXME: modify to actually fit my vision
/*
class C2SProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.current_strength = 0.0;
        this.target_strength = 0.0;
        this.smooth_delta = 0.2;

        this.port.onmessage = (event) => {
            if (event.data.mute) {
                this.target_strength = 0.0;
            } else if (event.data.strength) {
                this.target_strength = event.data.strength
            }
        };
    }
    process(inputs, outputs, parameters) {
        const output = outputs[0][0];

        for (let i = 0; i < output.length; i++) {
            this.current_strength += (this.target_strength - this.current_strength) * this.smooth_delta
            output[i] = (Math.random() * 2 - 1) * this.current_strength;
        }
        return true;
    }
}

registerProcessor("noise-processor", C2SProcessor);

*/

class C2SProcessor extends AudioWorkletProcessor {
    // 1. Declare the parameter
    static get parameterDescriptors() {
        return [{ 
            name: "strength", 
            defaultValue: 0.0, 
            minValue: 0.0, 
            maxValue: 1.0 
        }];
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0][0];
        const strengthValues = parameters.strength;

        for (let i = 0; i < output.length; i++) {
            // If the param is automated, it's an array. If static, it's length 1.
            const current_strength = strengthValues.length > 1 ? strengthValues[i] : strengthValues[0];
            
            const raw_noise = (Math.random() * 2 - 1);
            // Apply volume with a tiny 0.5 multiplier to avoid blowing eardrums
            output[i] = raw_noise * current_strength * 0.5;
        }
        return true;
    }
}

registerProcessor('noise-processor', C2SProcessor);