using System;
using System.Globalization;
using System.Text.RegularExpressions;

namespace SystemWorld.RealWorld {
public static class RealWorldSector {
 public const int Zoom = 18;
 const int N = 1 << Zoom;
 static readonly Regex IdRe = new Regex(@"^18/\d+/\d+$", RegexOptions.Compiled);

 public static void Parse(string id, out int x, out int y) {
  if (string.IsNullOrEmpty(id) || !IdRe.IsMatch(id)) throw new FormatException("Invalid sector");
  var parts = id.Split('/');
  x = int.Parse(parts[1], CultureInfo.InvariantCulture);
  y = int.Parse(parts[2], CultureInfo.InvariantCulture);
  if (x >= N || y >= N || id != Zoom + "/" + x + "/" + y) throw new FormatException("Invalid sector");
 }

 public static void Bounds(string id, out double west, out double south, out double east, out double north) {
  Parse(id, out var x, out var y);
  double Lat(int row) => Math.Atan(Math.Sinh(Math.PI * (1.0 - 2.0 * row / N))) * 180.0 / Math.PI;
  west = x / (double)N * 360.0 - 180.0;
  south = Lat(y + 1);
  east = (x + 1) / (double)N * 360.0 - 180.0;
  north = Lat(y);
 }
}
}
