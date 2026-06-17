import SwiftUI

struct TagView: View {
    let tag: Tag
    var isSelected: Bool = false
    var size: TagSize = .medium

    enum TagSize {
        case small
        case medium
        case large

        var font: Font {
            switch self {
            case .small: return FlightPathFonts.mono(size: 8)
            case .medium: return FlightPathFonts.mono(size: 10)
            case .large: return FlightPathFonts.mono(size: 12)
            }
        }

        var padding: EdgeInsets {
            switch self {
            case .small: return EdgeInsets(top: 4, leading: 8, bottom: 4, trailing: 8)
            case .medium: return EdgeInsets(top: 6, leading: 12, bottom: 6, trailing: 12)
            case .large: return EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16)
            }
        }
    }

    var body: some View {
        Text(tag.name)
            .font(size.font)
            .foregroundColor(isSelected ? FlightPathTheme.Background.primary : tagColor)
            .padding(size.padding)
            .background(
                ZStack {
                    if isSelected {
                        FlightPathTheme.Accent.primary
                    } else {
                        FlightPathTheme.Border.subtle
                    }
                }
            )
            .cornerRadius(FlightPathTheme.Radius.circle)
            .overlay(
                RoundedRectangle(cornerRadius: FlightPathTheme.Radius.circle)
                    .stroke(FlightPathTheme.Border.subtle, lineWidth: 1)
                    .opacity(isSelected ? 0 : 1)
            )
    }

    private var tagColor: Color {
        switch tag.color?.lowercased() {
        case "blue": return Color.blue
        case "green": return Color.green
        case "red": return Color.red
        case "orange": return Color.orange
        case "yellow": return Color.yellow
        case "purple": return Color.purple
        case "pink": return Color.pink
        case "gray": return Color.gray
        default: return FlightPathTheme.Text.secondary
        }
    }
}

#Preview {
    VStack(spacing: 12) {
        HStack {
            TagView(tag: Tag(id: "1", name: "Onboarding", color: "blue"))
            TagView(tag: Tag(id: "2", name: "Design", color: "orange"))
            TagView(tag: Tag(id: "3", name: "Important", color: "red"))
        }

        HStack {
            TagView(tag: Tag(id: "1", name: "Onboarding", color: "blue"), isSelected: true)
            TagView(tag: Tag(id: "2", name: "Design", color: "orange"), isSelected: true)
        }

        HStack {
            TagView(tag: Tag(id: "1", name: "Small", color: "green"), size: .small)
            TagView(tag: Tag(id: "2", name: "Medium", color: "green"), size: .medium)
            TagView(tag: Tag(id: "3", name: "Large", color: "green"), size: .large)
        }
    }
    .padding()
    .background(FlightPathTheme.Background.primary)
}
