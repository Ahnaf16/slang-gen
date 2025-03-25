# Slang Gen: Flutter i18n Extractor for Slang

A handy VS Code extension that helps Flutter developers **extract internationalized strings directly from their codebase** and add them to all `i18n` files.

This extension is a companion to the [slang](https://pub.dev/packages/slang) packages.

---

## ✨ Features

- ✅ **Extract i18n Strings**  
  Put the cursor on any string in a Dart file and extract it to your `i18n` files in one click.  
  The extension updates all locale files automatically.

- 🔍 **Auto-detect Variables**: Automatically detects embedded variables in strings  

- ⚙️ **Slang Initialization Command**  
  Quickly scaffold the `slang` dependency and configuration files (`slang.yaml`, translations, etc.) in your Flutter app.

---

## 🛠️ Usage

### 🏗️ Initialize Slang i18n

1. Open the command palette: `Ctrl + Shift + P` (or `Cmd + Shift + P` on macOS).
2. Run: `Slang Gen : Initialize`.
3. This will:
   - Add `slang`, `slang_flutter` and `slang_build_runner` to your `pubspec.yaml`
   - Create a basic `slang.yaml` config file
   - Generate the initial `i18n` files (`str_en.i18n.json`)

### 🔤 Extract Strings to i18n

1. Place the cursor on a hardcoded string in a Dart file. eg. `"Hello World"` or `"Hello ${name}"`.
2. Click the **light bulb icon** (`💡`) or press `Ctrl+.` to open quick fixes.
3. Select **"Extract to Tr"**.
4. This will:
   - Prompts to update the translation key if needed (e.g., `helloWorld`)
   - Moves the string to all `i18n.json` files.
   - Replaces the string in code with `t.helloWorld` or `Tr.of(context).helloWorld`.

5. This also works with strings with variables. eg. `"Hello ${name}"` will be replaced with `t.hello(name:name)` or `Tr.of(context).hello(name:name)`

## 🔧 Extension Settings

This extension provides configuration options under `extractToTr`:

| Setting | Default | Description |
|---------|---------|-------------|
| `slangGen.useContext` | `false` | if true, use `Tr.of(context)` |

---

## 📦 Requirements

- Your project must contain a `pubspec.yaml` file.
- The `slang` dependencies (added automatically by this extension)

---

## 📁 File Structure Example

```txt
lib/
    └── main.dart
    └── i18n/
        ├── str_en.i18n.json
        ├── str_es.i18n.json
        └── ...
slang.yaml
pubspec.yaml
```

---

## 📌 Extension Commands

| Command | Description |
|--------|-------------|
| `Slang Gen : Initialize` | Set up `slang` in your Flutter project |
| `Extract to Tr` | Converts a hardcoded string into a Slang translation |

---

## ⚠️ Troubleshooting

- **Extension not working?**  
  - Ensure `pubspec.yaml` exists in the root of your workspace.  
  - Check the **Output** tab for logs (`View > Output > Extract to Tr`).

## 🤝 Contributions

Pull requests, suggestions, and feedback are welcome! Help improve this extension for all Flutter developers around the world. 🌐

---

## 📃 License

MIT License

---

Built with ❤️ for Flutter devs.
