/* Copyright (c) 2010, Carl Burch. License information is located in the
 * com.cburch.logisim.Main source code and at www.cburch.com/logisim/. */

package com.cburch.logisim.file;

import java.io.File;
import java.io.IOException;
import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.WeakHashMap;
import java.util.Set;
import java.util.LinkedHashSet;

import com.cburch.logisim.tools.Library;
import com.cburch.logisim.util.StringUtil;

import java.io.InputStream;

class LibraryManager {
	public static final LibraryManager instance = new LibraryManager();

	private static char desc_sep = '#';
	
	private static abstract class LibraryDescriptor {
		abstract boolean concernsFile(File query);
		abstract String toDescriptor(Loader loader);
		abstract void setBase(Loader loader, LoadedLibrary lib)
			throws LoadFailedException;
	}
	
	private static class LogisimProjectDescriptor extends LibraryDescriptor {
		private File file;
		
		LogisimProjectDescriptor(File file) {
			this.file = file;
		}
		
		@Override
		boolean concernsFile(File query) {
			return file.equals(query);
		}
		
		@Override
		String toDescriptor(Loader loader) {
			return "file#" + toRelative(loader, file);
		}
		
		@Override
		void setBase(Loader loader, LoadedLibrary lib) throws LoadFailedException {
			lib.setBase(loader.loadLogisimFile(file));
		}
		
		@Override
		public boolean equals(Object other) {
			if (!(other instanceof LogisimProjectDescriptor)) return false;
			LogisimProjectDescriptor o = (LogisimProjectDescriptor) other;
			return this.file.equals(o.file);
		}
		
		@Override
		public int hashCode() {
			return file.hashCode();
		}
	}
	
	private static class JarDescriptor extends LibraryDescriptor {
		private File file;
		private String className;
		
		JarDescriptor(File file, String className) {
			this.file = file;
			this.className = className;
		}
		
		@Override
		boolean concernsFile(File query) {
			return file.equals(query);
		}

		@Override
		String toDescriptor(Loader loader) {
			return "jar#" + toRelative(loader, file) + desc_sep + className;
		}
		
		@Override
		void setBase(Loader loader, LoadedLibrary lib) throws LoadFailedException {
			lib.setBase(loader.loadJarFile(file, className));
		}
		
		@Override
		public boolean equals(Object other) {
			if (!(other instanceof JarDescriptor)) return false;
			JarDescriptor o = (JarDescriptor) other;
			return this.file.equals(o.file) && this.className.equals(o.className);
		}
		
		@Override
		public int hashCode() {
			return file.hashCode() * 31 + className.hashCode();
		}
	}

	// class for descriping local libraries 
	private static class LocalDescriptor extends LibraryDescriptor {
		private String filehandleId;
		private InputStream input;
		private boolean isJar;
		private String name;
		
		LocalDescriptor(String filehandleId, InputStream input, boolean isJar, String name) {
			this.filehandleId = filehandleId;
			this.input = input;
			this.isJar = isJar;
			this.name = name;
		}
		
		@Override
		boolean concernsFile(File query) {
			return false; // can't know with this
		}

		boolean concernsLocalFile(String id) {
			return this.filehandleId == id;
		}

		String getFilehandleID() {
			return this.filehandleId;
		}

		String getName() {
			return this.name;
		}

		@Override
		String toDescriptor(Loader loader) {
			return "local#" + this.filehandleId + "#" + this.name;
		}
		
		@Override
		void setBase(Loader loader, LoadedLibrary lib) throws LoadFailedException {
			if (this.isJar) {
				lib.setBase(loader.loadJarFile(input, name));
			} else {
				lib.setBase(loader.loadLogisimFile(input, name));
			}
		}
		
		@Override
		public boolean equals(Object other) {
			if (!(other instanceof LocalDescriptor)) return false;
			LocalDescriptor o = (LocalDescriptor) other;
			return this.filehandleId.equals(o.filehandleId);
		}
		
		@Override
		public int hashCode() {
			return filehandleId.hashCode();
		}
	}
	
	private HashMap<LibraryDescriptor,WeakReference<LoadedLibrary>> fileMap;
	private WeakHashMap<LoadedLibrary,LibraryDescriptor> invMap;

	private LibraryManager() {
		fileMap = new HashMap<LibraryDescriptor,WeakReference<LoadedLibrary>>();
		invMap = new WeakHashMap<LoadedLibrary,LibraryDescriptor>();
		ProjectsDirty.initialize();
	}
	
	void setDirty(File file, boolean dirty) {
		LoadedLibrary lib = findKnown(file);
		if (lib != null) {
			lib.setDirty(dirty);
		}
	}
	
	Collection<LogisimFile> getLogisimLibraries() {
		ArrayList<LogisimFile> ret = new ArrayList<LogisimFile>();
		for (LoadedLibrary lib : invMap.keySet()) {
			if (lib.getBase() instanceof LogisimFile) {
				ret.add((LogisimFile) lib.getBase());
			}
		}
		return ret;
	}

	public Library loadLibrary(Loader loader, String desc) {
		// It may already be loaded.
		// Otherwise we'll have to decode it.
		int sep = desc.indexOf(desc_sep);
		if (sep < 0) {
			loader.showError(StringUtil.format(Strings.get("fileDescriptorError"), desc));
			return null;
		}
		String type = desc.substring(0, sep);
		String name = desc.substring(sep + 1);

		if (type.equals("")) {
			Library ret = loader.getBuiltin().getLibrary(name);
			if (ret == null) {
				loader.showError(StringUtil.format(Strings.get("fileBuiltinMissingError"), name));
				return null;
			}
			return ret;
		} else if (type.equals("file")) {
			File toRead = loader.getFileFor(name, Loader.LOGISIM_FILTER);
			return loadLogisimLibrary(loader, toRead);
		} else if (type.equals("jar")) {
			int sepLoc = name.lastIndexOf(desc_sep);
			String fileName = name.substring(0, sepLoc);
			String className = name.substring(sepLoc + 1);
			File toRead = loader.getFileFor(fileName, Loader.JAR_FILTER);
			return loadJarLibrary(loader, toRead, className);
		} else if (type.equals("local")){
			// we know its a local file
			// we have the handle id so we can ask native - if native doesn't know it can ask the user to pick a file
			Library lib = findLocalLibrary(name, loader);
			if (lib == null) {
				loader.showError(Strings.get("fileLoadCanceledError"));
				return null;
			}
			return lib;
		} else {
			loader.showError(StringUtil.format(Strings.get("fileTypeError"),
				type, desc));
			return null;
		}
	}

	public static native LoadedLibrary findLocalLibrary(String id, Loader loader);
	
	public LoadedLibrary loadLogisimLibrary(Loader loader, File toRead) {
		LoadedLibrary ret = findKnown(toRead);
		if (ret != null) return ret;
		
		try {
			ret = new LoadedLibrary(loader.loadLogisimFile(toRead));
		} catch (LoadFailedException e) {
			loader.showError(e.getMessage());
			return null;
		}
		
		LogisimProjectDescriptor desc = new LogisimProjectDescriptor(toRead);
		fileMap.put(desc, new WeakReference<LoadedLibrary>(ret));
		invMap.put(ret, desc);
		return ret;
	}

	public LoadedLibrary loadLogisimLibrary(Loader loader, InputStream input, String filename, String filehandleID) {
		LocalDescriptor localDescriptor = new LocalDescriptor(filehandleID, input, false, filename);
		LoadedLibrary ret = findKnown(localDescriptor);
		if (ret != null) return ret;
		try {
			ret = new LoadedLibrary(loader.loadLogisimFile(input, filename));
		} catch (LoadFailedException e) {
			loader.showError(e.getMessage());
			return null;
		}
		fileMap.put(localDescriptor, new WeakReference<LoadedLibrary>(ret));
		invMap.put(ret, localDescriptor);
		return ret;
	}
	
	public LoadedLibrary loadJarLibrary(Loader loader, File toRead, String className) {
		JarDescriptor jarDescriptor = new JarDescriptor(toRead, className);
		LoadedLibrary ret = findKnown(jarDescriptor);
		if (ret != null) return ret;

		try {
			ret = new LoadedLibrary(loader.loadJarFile(toRead, className));
		} catch (LoadFailedException e) {
			loader.showError(e.getMessage());
			return null;
		}
		
		fileMap.put(jarDescriptor, new WeakReference<LoadedLibrary>(ret));
		invMap.put(ret, jarDescriptor);
		return ret;
	}

	public LoadedLibrary loadJarLibrary(Loader loader, InputStream toRead, String className, String filehandleID) {
		LocalDescriptor localDescriptor = new LocalDescriptor(filehandleID, toRead, true, className);
		LoadedLibrary ret = findKnown(localDescriptor);
		if (ret != null) return ret;

		try {
			ret = new LoadedLibrary(loader.loadJarFile(toRead, className));
		} catch (LoadFailedException e) {
			loader.showError(e.getMessage());
			return null;
		}
		
		fileMap.put(localDescriptor, new WeakReference<LoadedLibrary>(ret));
		invMap.put(ret, localDescriptor);
		return ret;
	}
	
	public void reload(Loader loader, LoadedLibrary lib) {
		LibraryDescriptor descriptor = invMap.get(lib);
		if (descriptor == null) {
			loader.showError(StringUtil.format(Strings.get("unknownLibraryFileError"),
					lib.getDisplayName()));
		} else {
			try {
				descriptor.setBase(loader, lib);
			} catch (LoadFailedException e) {
				loader.showError(e.getMessage());
			}
		}
	}
	
	public Library findReference(LogisimFile file, File query) {
		for (Library lib : file.getLibraries()) {
			LibraryDescriptor desc = invMap.get(lib);
			if (desc != null && desc.concernsFile(query)) {
				return lib;
			}
			if (lib instanceof LoadedLibrary) {
				LoadedLibrary loadedLib = (LoadedLibrary) lib;
				if (loadedLib.getBase() instanceof LogisimFile) {
					LogisimFile loadedProj = (LogisimFile) loadedLib.getBase();
					Library ret = findReference(loadedProj, query);
					if (ret != null) return lib;
				}
			}
		}
		return null;
	}

	public String[] findAllLocalReferences(LogisimFile file) {
		Set<String> matches = new LinkedHashSet();
		findAllLocalReferencesRecursive(file, matches);
		String[] s = new String[0];
		return matches.toArray(s);
	}

	private void findAllLocalReferencesRecursive(LogisimFile file, Set<String> matches) {
		for (Library lib : file.getLibraries()) {
			LibraryDescriptor desc = invMap.get(lib);
			if (desc instanceof LocalDescriptor) {
				LocalDescriptor localDesc = (LocalDescriptor) desc;
				matches.add(localDesc.getFilehandleID());
			}
			if (lib instanceof LoadedLibrary) {
				LoadedLibrary loadedLib = (LoadedLibrary) lib;
				if (loadedLib.getBase() instanceof LogisimFile) {
					LogisimFile nestedFile = (LogisimFile) loadedLib.getBase();
					findAllLocalReferencesRecursive(nestedFile, matches);
				}
			}
		}
	}
	
	public void fileSaved(Loader loader, File dest, File oldFile, LogisimFile file) {
		LoadedLibrary old = findKnown(oldFile);
		if (old != null) {
			old.setDirty(false);
		}
		
		LoadedLibrary lib = findKnown(dest);
		if (lib != null) {
			LogisimFile clone = file.cloneLogisimFile(loader);
			clone.setName(file.getName());
			clone.setDirty(false);
			lib.setBase(clone);
		}
	}

	public String getDescriptor(Loader loader, Library lib) {
		if (loader.getBuiltin().getLibraries().contains(lib)) {
			return desc_sep + lib.getName();
		} else {
			LibraryDescriptor desc = invMap.get(lib);
			if (desc != null) {
				return desc.toDescriptor(loader);
			} else {
				throw new LoaderException(StringUtil.format(
						Strings.get("fileDescriptorUnknownError"), lib.getDisplayName()));
			}
		}
	}

	private LoadedLibrary findKnown(Object key) {
		WeakReference<LoadedLibrary> retLibRef;
		retLibRef = fileMap.get(key);
		if (retLibRef == null) {
			return null;
		} else {
			LoadedLibrary retLib = retLibRef.get();
			if (retLib == null) {
				fileMap.remove(key);
				return null;
			} else {
				return retLib;
			}
		}
	}
	
	private static String toRelative(Loader loader, File file) {
		File currentDirectory = loader.getCurrentDirectory();
		if (currentDirectory == null) {
			try {
				return file.getCanonicalPath();
			} catch (IOException e) {
				return file.toString();
			}
		}

		File fileDir = file.getParentFile();
		if (fileDir != null) {
			if (currentDirectory.equals(fileDir)) {
				return file.getName();
			} else if (currentDirectory.equals(fileDir.getParentFile())) {
				return fileDir.getName() + "/" + file.getName();
			} else if (fileDir.equals(currentDirectory.getParentFile())) {
				return "../" + file.getName();
			}
		}
		try {
			return file.getCanonicalPath();
		} catch (IOException e) {
			return file.toString();
		}
	}
}