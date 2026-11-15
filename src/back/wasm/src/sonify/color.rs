/// Color utilities for the analysis engine.
use image::{Rgb};
use palette::{IntoColor, Lab, Srgb, color_difference::{Ciede2000, ImprovedCiede2000}, white_point::D65}; 

/// Converts a [u8; 3] to an palette::Srgb<f32>, then converts that into a Lab<D65, f32>.
pub(crate) fn rgb_to_lab(rgb : [u8; 3]) -> Lab<D65, f32> {
    let standarized = Srgb::from(rgb).into_format::<f32>();
    standarized.into_color()
}

/// Convert a Lab<D65, f32> into a [u8; 3]. Lossy for the floating points.
pub(crate) fn lab_to_rgb(lab : Lab<D65, f32>) -> [u8; 3] {  
    let standarized : Srgb<f32> = lab.into_color();
    let (r, g, b) = standarized.into_format::<u8>().into_components();
    [r,g,b]
}