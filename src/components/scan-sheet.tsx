import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef } from "react";
import { Linking, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { parseIsbn } from "@/lib/isbn";
import { strings } from "@/lib/strings";
import { useColors } from "@/lib/theme";

type Props = { visible: boolean; onClose: () => void; onIsbn: (isbn: string) => void };

export function ScanSheet({ visible, onClose, onIsbn }: Props) {
  const c = useColors();
  const [permission, requestPermission] = useCameraPermissions();
  const handled = useRef(false);

  function onScanned({ data }: { data: string }) {
    const isbn = parseIsbn(data);
    if (!isbn || handled.current) return; // ignore non-ISBN barcodes; the camera fires repeatedly
    handled.current = true;
    onIsbn(isbn);
  }

  const denied = permission && !permission.granted;
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}
      onShow={() => { handled.current = false; }}>
      <View style={[styles.flex, { backgroundColor: c.bg }]}>
        {permission?.granted ? (
          <CameraView style={styles.flex} barcodeScannerSettings={{ barcodeTypes: ["ean13"] }} onBarcodeScanned={onScanned} />
        ) : (
          <View style={styles.center}>
            <Text style={{ color: c.text, textAlign: "center" }}>{strings.scan.permission}</Text>
            {denied && (
              <Pressable onPress={() => (permission.canAskAgain ? requestPermission() : Linking.openSettings())} accessibilityRole="button">
                <Text style={{ color: c.accent, padding: 12 }}>
                  {permission.canAskAgain ? strings.scan.allow : strings.scan.openSettings}
                </Text>
              </Pressable>
            )}
          </View>
        )}
        <Pressable onPress={onClose} accessibilityRole="button" style={styles.close}>
          <Text style={{ color: c.accent, fontSize: 17 }}>{strings.scan.close}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  close: { position: "absolute", top: 16, right: 16, padding: 8, backgroundColor: "#0008", borderRadius: 8 },
});
