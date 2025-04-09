package com.wasm.helpers;

import java.io.ByteArrayInputStream;

public class ByteArrayConverter {

    public static ByteArrayInputStream convertObjectToByteArray(Object[] input) throws IllegalArgumentException {
        // Convert Object[] to byte[]
		byte[] byteArray = new byte[input.length];
		for (int i = 0; i < input.length; i++) {
			if (input[i] instanceof Byte) {
				byteArray[i] = (Byte) input[i]; // Cast and store byte value
			} else {
				throw new IllegalArgumentException("Invalid array element type, expected Byte");
			}
		}
        ByteArrayInputStream out = new ByteArrayInputStream(byteArray);
        return out;
    }
} 