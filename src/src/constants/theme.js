export const COLORS = {
  bg: '#0D1117',
  background: '#0D1117',
  card: '#161B22',
  cardAlt: '#1C2333',
  border: '#30363D',
  primary: '#58A6FF',
  primaryDark: '#1F6FEB',
  success: '#3FB950',
  warning: '#D29922',
  danger: '#F85149',
  text: '#E6EDF3',
  textSecondary: '#8B949E',
  textMuted: '#484F58',
  muted: '#484F58',
  textSubtle: '#484F58',
  placeholder: '#484F58',
  white: '#FFFFFF',
  black: '#000000',
  input: '#0D1117',
  overlay: 'rgba(0,0,0,0.6)',
  buttonText: '#FFFFFF',
  surface: '#161B22',
};

export const FONTS = {
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  heading: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  subheading: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  body: { fontSize: 14, color: COLORS.text },
  caption: { fontSize: 12, color: COLORS.textSecondary },
  small: { fontSize: 11, color: COLORS.textMuted },
  // Size values used as fontSize in StyleSheet definitions
  lg: 18,
  md: 15,
  sm: 13,
  xs: 11,
};

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 };

export const CARD_STYLE = {
  backgroundColor: COLORS.card,
  borderRadius: 10,
  padding: SPACING.lg,
  marginBottom: SPACING.md,
  borderWidth: 1,
  borderColor: COLORS.border,
};

export const INPUT_STYLE = {
  backgroundColor: COLORS.input,
  borderWidth: 1,
  borderColor: COLORS.border,
  borderRadius: 8,
  padding: SPACING.md,
  color: COLORS.text,
  fontSize: 14,
};

export const BTN = {
  primary: {
    backgroundColor: COLORS.primaryDark,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 8,
    alignItems: 'center',
  },
  danger: {
    backgroundColor: COLORS.danger,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 8,
    alignItems: 'center',
  },
  text: { color: COLORS.white, fontSize: 14, fontWeight: '600' },
  primaryText: { color: COLORS.white, fontSize: 14, fontWeight: '600' },
  outline: {
    backgroundColor: 'transparent',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
  },
  outlineText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  secondary: {
    backgroundColor: COLORS.card,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  disabled: { opacity: 0.5 },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.xl,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
};

export const NAV_THEME = {
  headerStyle: { backgroundColor: '#010409' },
  headerTintColor: COLORS.text,
  headerTitleStyle: { fontWeight: '600', fontSize: 17 },
  contentStyle: { backgroundColor: COLORS.bg },
};
