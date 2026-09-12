import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const CollapsibleCard = ({
  title,
  subtitle,
  icon,
  children,
  initialOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsOpen(value => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
      >
        <View style={styles.iconShell}>
          <Icon name={icon} size={18} color="#e6a84b" />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <View style={styles.chevronShell}>
          <Icon
            name={isOpen ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#aab7cb"
          />
        </View>
      </TouchableOpacity>
      {isOpen ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
};

export default CollapsibleCard;

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: 'rgba(12,18,33,0.92)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(104,122,156,0.3)',
    overflow: 'hidden',
  },
  header: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  iconShell: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(230,168,75,0.1)',
  },
  copy: { flex: 1, marginHorizontal: 12 },
  title: { color: '#fff7dd', fontSize: 15, fontWeight: '800' },
  subtitle: { color: '#8492a9', fontSize: 11, marginTop: 3 },
  chevronShell: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#172238',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(104,122,156,0.18)',
  },
});
