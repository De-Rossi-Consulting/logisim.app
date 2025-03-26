package com.wasm.gui;

import javax.swing.*;

import com.cburch.logisim.proj.Project;
import com.cburch.logisim.gui.main.Frame;

public class MemorySelectDialog {
    MemorySelectDialog() {}

    public static int ShowMemorySelectDialog(Project proj) {
        Frame frame = proj.getFrame();
        Object[] options = new Object[]{Strings.get("openLocationLocal"), Strings.get("openLocationCache")};
        int option = JOptionPane.showOptionDialog(proj.getFrame(),
                Strings.get("openLocationMessage"),
                Strings.get("openLocationTitle"),
                JOptionPane.YES_NO_OPTION,
                JOptionPane.QUESTION_MESSAGE,
                null, options, options[0]);

        return option;
    }
    
}