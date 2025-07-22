import os
import sys
from markitdown import MarkItDown


def convert_to_markdown(input_path, output_dir):
    """Converts a file to Markdown using the markitdown library."""
    try:
        md = MarkItDown()
        result = md.convert(input_path)
        output_filename = os.path.splitext(
            os.path.basename(input_path))[0] + ".md"
        output_path = os.path.join(output_dir, output_filename)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(result.text_content)
        return f"Converted {input_path} to {output_path}"
    except Exception as e:
        return f"Error converting {input_path}: {e}"


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python converter.py <input_file> <output_directory>",
              file=sys.stderr)
        sys.exit(1)

    input_file = sys.argv[1]
    output_dir = sys.argv[2]

    if not os.path.exists(input_file):
        print(
            f"Error: Input file '{input_file}' does not exist", file=sys.stderr)
        sys.exit(1)

    if not os.path.exists(output_dir):
        print(
            f"Error: Output directory '{output_dir}' does not exist", file=sys.stderr)
        sys.exit(1)

    result = convert_to_markdown(input_file, output_dir)

    if result.startswith("Error"):
        print(result, file=sys.stderr)
        sys.exit(1)
    else:
        print(result)
        sys.exit(0)
