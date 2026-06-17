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
            case .small: return .caption2
            case .medium: return .caption
            case .large: return .callout
            }
        }

        var padding: CGFloat {
            switch self {
            case .small: return 4
            case .medium: return 6
            case .large: return 8
            }
        }
    }

    var body: some View {
        Text(tag.name)
            .font(size.font)
            .fontWeight(.medium)
            .padding(.horizontal, size.padding + 4)
            .padding(.vertical, size.padding)
            .background(backgroundColor)
            .foregroundStyle(foregroundColor)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .strokeBorder(borderColor, lineWidth: isSelected ? 2 : 0)
            )
    }

    private var backgroundColor: Color {
        if isSelected {
            return .blue
        }

        switch tag.color?.lowercased() {
        case "blue": return .blue.opacity(0.2)
        case "green": return .green.opacity(0.2)
        case "red": return .red.opacity(0.2)
        case "orange": return .orange.opacity(0.2)
        case "yellow": return .yellow.opacity(0.2)
        case "purple": return .purple.opacity(0.2)
        case "pink": return .pink.opacity(0.2)
        case "gray": return .gray.opacity(0.2)
        default: return .gray.opacity(0.2)
        }
    }

    private var foregroundColor: Color {
        if isSelected {
            return .white
        }

        switch tag.color?.lowercased() {
        case "blue": return .blue
        case "green": return .green
        case "red": return .red
        case "orange": return .orange
        case "yellow": return .yellow
        case "purple": return .purple
        case "pink": return .pink
        case "gray": return .gray
        default: return .gray
        }
    }

    private var borderColor: Color {
        .blue
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
}
